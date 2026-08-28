from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from urllib.parse import quote

from fastapi import HTTPException, status

from app.auth.permissions import ROLE_PERMISSIONS, Permission, resolve_permissions
from app.auth.schemas import (
    AuthenticatedUserResponse,
    InvitationPublic,
    MemberPublic,
    MembershipPublic,
    OrganizationPublic,
    RolePublic,
    SessionPublic,
    UserPublic,
)
from app.core.config import Settings
from app.core.email import email_service
from app.core.security import (
    TokenTtl,
    hash_password,
    hash_token,
    new_recovery_codes,
    new_token,
    new_totp_secret,
    utc_now,
    verify_password,
    verify_totp,
)


@dataclass
class Tenant:
    id: str
    name: str


@dataclass
class UserRecord:
    id: str
    tenant_id: str
    first_name: str
    last_name: str
    email: str
    password_hash: str
    role: str
    data_scope: str
    email_verified: bool = False
    mfa_enabled: bool = False
    mfa_secret: str | None = None
    pending_mfa_secret: str | None = None
    recovery_code_hashes: set[str] = field(default_factory=set)
    active: bool = True
    password_reset_required: bool = False
    custom_permissions: set[Permission] = field(default_factory=set)


@dataclass
class SessionRecord:
    id: str
    user_id: str
    tenant_id: str
    access_token: str
    created_at: datetime
    last_active_at: datetime
    expires_at: datetime
    device: str
    location: str
    mfa_verified: bool
    revoked_at: datetime | None = None

    @property
    def active(self) -> bool:
        return self.revoked_at is None and utc_now() < self.expires_at


@dataclass
class InvitationRecord:
    id: str
    tenant_id: str
    email: str
    role: str
    data_scope: str
    invited_by_user_id: str
    token_hash: str
    created_at: datetime
    expires_at: datetime
    status: str


@dataclass
class OneTimeTokenRecord:
    user_id: str
    expires_at: datetime


@dataclass(frozen=True)
class RequestContext:
    user: UserRecord
    tenant: Tenant
    session: SessionRecord
    permissions: set[Permission]

    def require(self, *required: Permission) -> None:
        if not self.user.active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "account_disabled",
                    "message": "This account has been deactivated.",
                },
            )
        if self.user.password_reset_required:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "password_reset_required",
                    "message": "Reset your password before accessing this resource.",
                },
            )
        if not self.user.email_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "email_verification_required",
                    "message": "Verify your work email before accessing this resource.",
                },
            )
        if self.user.mfa_enabled and not self.session.mfa_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "mfa_required",
                    "message": "Two-factor authentication is required before accessing this resource.",
                },
            )
        missing = [permission.value for permission in required if permission not in self.permissions]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "permission_denied",
                    "message": "Your role or data permissions do not allow this action.",
                    "missingPermissions": missing,
                },
            )


class AuthService:
    def __init__(self) -> None:
        self.tenants: dict[str, Tenant] = {}
        self.users: dict[str, UserRecord] = {}
        self.sessions: dict[str, SessionRecord] = {}
        self.invitations: dict[str, InvitationRecord] = {}
        self.security_events: list[dict[str, str]] = []
        self.email_verification_tokens: dict[str, OneTimeTokenRecord] = {}
        self.password_reset_tokens: dict[str, OneTimeTokenRecord] = {}

    def register(
        self,
        *,
        first_name: str,
        last_name: str,
        email: str,
        password: str,
        organization_name: str | None,
        accepted_terms: bool,
        settings: Settings,
    ) -> AuthenticatedUserResponse:
        if not accepted_terms:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "terms_required", "message": "Terms acceptance is required."},
            )

        normalized_email = normalize_email(email)
        existing_user = self._find_user_by_email(normalized_email)
        if existing_user:
            self._audit("REGISTER_DUPLICATE_ATTEMPT", existing_user.id, existing_user.tenant_id)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "registration_unavailable", "message": "Unable to create this account."},
            )

        normalized_organization = (organization_name or "").strip()
        if not normalized_organization:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "organization_required", "message": "Organization name is required."},
            )
        tenant_id = new_token("org")
        self.tenants[tenant_id] = Tenant(id=tenant_id, name=normalized_organization)

        user = UserRecord(
            id=new_token("user"),
            tenant_id=tenant_id,
            first_name=first_name,
            last_name=last_name,
            email=normalized_email,
            password_hash=hash_password(password),
            role="Organization Admin",
            data_scope="All organization data and administrative controls",
        )
        self.users[user.id] = user
        self._issue_email_verification(user, settings)
        self._audit("REGISTER_SUCCESS", user.id, user.tenant_id)
        return self._auth_response(user, access_token=None, expires_at=None)

    def login(
        self,
        *,
        email: str,
        password: str,
        remember_device: bool,
        user_agent: str | None,
    ) -> tuple[AuthenticatedUserResponse, SessionRecord]:
        user = self._find_user_by_email(normalize_email(email))
        if not user or not verify_password(password, user.password_hash):
            self._audit("LOGIN_FAILURE", user.id if user else "unknown", user.tenant_id if user else "unknown")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "invalid_credentials", "message": "Email or password is incorrect."},
            )

        if not user.active:
            self._audit("LOGIN_DISABLED_ACCOUNT", user.id, user.tenant_id)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "account_disabled", "message": "This account has been deactivated."},
            )

        ttl_seconds = 60 * 60 * 8 if remember_device else 60 * 15
        ttl = TokenTtl.from_seconds(ttl_seconds)
        session = SessionRecord(
            id=new_token("sess"),
            user_id=user.id,
            tenant_id=user.tenant_id,
            access_token=new_token("wt_access"),
            created_at=ttl.issued_at,
            last_active_at=ttl.issued_at,
            expires_at=ttl.expires_at,
            device=compact_user_agent(user_agent),
            location="Location unavailable",
            mfa_verified=not user.mfa_enabled,
        )
        self.sessions[session.id] = session
        self._audit("SESSION_CREATED", user.id, user.tenant_id)
        return (
            self._auth_response(
                user,
                access_token=session.access_token,
                expires_at=session.expires_at,
                mfa_verified=session.mfa_verified,
            ),
            session,
        )

    def authenticate(self, *, access_token: str | None, session_id: str | None) -> RequestContext:
        session = self._find_session(access_token=access_token, session_id=session_id)
        if not session or not session.active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "session_invalid", "message": "Authentication is required."},
            )

        user = self.users.get(session.user_id)
        tenant = self.tenants.get(session.tenant_id)
        if not user or not tenant or user.tenant_id != tenant.id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "session_invalid", "message": "Authentication is required."},
            )

        session.last_active_at = utc_now()
        permissions = resolve_permissions(user.role, user.custom_permissions)
        return RequestContext(user=user, tenant=tenant, session=session, permissions=permissions)

    def logout(self, context: RequestContext) -> None:
        context.session.revoked_at = utc_now()
        self._audit("SESSION_REVOKED", context.user.id, context.tenant.id)

    def refresh(self, context: RequestContext) -> tuple[AuthenticatedUserResponse, SessionRecord]:
        ttl = TokenTtl.from_seconds(60 * 15)
        context.session.access_token = new_token("wt_access")
        context.session.expires_at = ttl.expires_at
        context.session.last_active_at = ttl.issued_at
        self._audit("SESSION_REFRESHED", context.user.id, context.tenant.id)
        return (
            self._auth_response(
                context.user,
                access_token=context.session.access_token,
                expires_at=context.session.expires_at,
                mfa_verified=context.session.mfa_verified,
            ),
            context.session,
        )

    def me(self, context: RequestContext) -> AuthenticatedUserResponse:
        return self._auth_response(
            context.user,
            access_token=None,
            expires_at=context.session.expires_at,
            mfa_verified=context.session.mfa_verified,
        )

    def list_sessions(self, context: RequestContext) -> list[SessionPublic]:
        context.require(Permission.AUTH_SESSIONS_MANAGE)
        sessions = [
            session
            for session in self.sessions.values()
            if session.user_id == context.user.id and session.revoked_at is None
        ]
        return [self._session_public(session, session.id == context.session.id) for session in sessions]

    def revoke_session(self, context: RequestContext, session_id: str) -> None:
        context.require(Permission.AUTH_SESSIONS_MANAGE)
        session = self.sessions.get(session_id)
        if not session or session.user_id != context.user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")
        session.revoked_at = utc_now()
        self._audit("SESSION_REVOKED", context.user.id, context.tenant.id)

    def revoke_other_sessions(self, context: RequestContext) -> None:
        context.require(Permission.AUTH_SESSIONS_MANAGE)
        for session in self.sessions.values():
            if session.user_id == context.user.id and session.id != context.session.id:
                session.revoked_at = utc_now()
        self._audit("OTHER_SESSIONS_REVOKED", context.user.id, context.tenant.id)

    def change_password(self, context: RequestContext, current_password: str, new_password: str) -> None:
        if not verify_password(current_password, context.user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "invalid_password", "message": "Unable to change password."},
            )
        context.user.password_hash = hash_password(new_password)
        self.revoke_other_sessions(context)
        self._audit("PASSWORD_CHANGED", context.user.id, context.tenant.id)

    def verify_email(self, token: str) -> None:
        token_hash = hash_token(token)
        record = self.email_verification_tokens.pop(token_hash, None)
        if not record or utc_now() >= record.expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "invalid_token", "message": "Verification link is invalid or expired."},
            )
        user = self.users.get(record.user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification failed.")
        user.email_verified = True
        self._audit("EMAIL_VERIFIED", user.id, user.tenant_id)

    def resend_verification(self, email: str, settings: Settings) -> None:
        user = self._find_user_by_email(normalize_email(email))
        if user and not user.email_verified:
            self._issue_email_verification(user, settings)
            self._audit("EMAIL_VERIFICATION_REQUESTED", user.id, user.tenant_id)

    def request_password_reset(self, email: str, settings: Settings) -> None:
        user = self._find_user_by_email(normalize_email(email))
        if not user or not user.active:
            return
        raw_token = new_token("password_reset")
        self.password_reset_tokens[hash_token(raw_token)] = OneTimeTokenRecord(
            user_id=user.id,
            expires_at=utc_now() + timedelta(minutes=30),
        )
        reset_url = f"{settings.public_app_url}/reset-password?token={quote(raw_token)}"
        email_service.send_password_reset(
            settings=settings,
            to_email=user.email,
            reset_url=reset_url,
        )
        self._audit("PASSWORD_RESET_REQUESTED", user.id, user.tenant_id)

    def reset_password(self, token: str, new_password: str) -> None:
        record = self.password_reset_tokens.pop(hash_token(token), None)
        if not record or utc_now() >= record.expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "invalid_token", "message": "Reset link is invalid or expired."},
            )
        user = self.users.get(record.user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password reset failed.")
        user.password_hash = hash_password(new_password)
        for session in self.sessions.values():
            if session.user_id == user.id:
                session.revoked_at = utc_now()
        self._audit("PASSWORD_RESET_COMPLETED", user.id, user.tenant_id)

    def setup_mfa(self, context: RequestContext) -> dict[str, object]:
        secret = new_totp_secret()
        context.user.pending_mfa_secret = secret
        account = quote(context.user.email)
        return {
            "issuer": "WealthTwin",
            "account": context.user.email,
            "secret": secret,
            "setupUri": f"otpauth://totp/WealthTwin:{account}?secret={secret}&issuer=WealthTwin",
        }

    def enable_mfa(self, context: RequestContext, code: str) -> list[str]:
        secret = context.user.pending_mfa_secret
        if not secret or not verify_totp(secret, code):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code.")
        recovery_codes = new_recovery_codes()
        context.user.mfa_secret = secret
        context.user.pending_mfa_secret = None
        context.user.recovery_code_hashes = {hash_token(code) for code in recovery_codes}
        context.user.mfa_enabled = True
        context.session.mfa_verified = True
        self._audit("MFA_ENABLED", context.user.id, context.tenant.id)
        return recovery_codes

    def verify_mfa(self, context: RequestContext, code: str) -> None:
        valid_totp = bool(context.user.mfa_secret and verify_totp(context.user.mfa_secret, code))
        recovery_hash = hash_token(code.upper())
        valid_recovery = recovery_hash in context.user.recovery_code_hashes
        if not valid_totp and not valid_recovery:
            self._audit("MFA_FAILED", context.user.id, context.tenant.id)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code.")
        if valid_recovery:
            context.user.recovery_code_hashes.remove(recovery_hash)
        context.session.mfa_verified = True
        self._audit("MFA_VERIFIED", context.user.id, context.tenant.id)

    def disable_mfa(self, context: RequestContext) -> None:
        context.user.mfa_enabled = False
        context.user.mfa_secret = None
        context.user.pending_mfa_secret = None
        context.user.recovery_code_hashes.clear()
        self._audit("MFA_DISABLED", context.user.id, context.tenant.id)

    def regenerate_recovery_codes(self, context: RequestContext) -> list[str]:
        context.require(Permission.SETTINGS_SECURITY_VIEW)
        if not context.user.mfa_enabled:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="MFA is not enabled.")
        recovery_codes = new_recovery_codes()
        context.user.recovery_code_hashes = {hash_token(code) for code in recovery_codes}
        self._audit("MFA_RECOVERY_CODES_REGENERATED", context.user.id, context.tenant.id)
        return recovery_codes

    def list_members(self, context: RequestContext) -> list[MemberPublic]:
        context.require(Permission.ADMIN_MEMBERS_MANAGE)
        return [
            self._member_public(user)
            for user in self.users.values()
            if user.tenant_id == context.tenant.id
        ]

    def list_roles(self, context: RequestContext) -> list[RolePublic]:
        context.require(Permission.ADMIN_ROLES_MANAGE)
        descriptions = {
            "Organization Admin": "Can manage organization users, roles, invitations, integrations, configuration, and all dashboards.",
            "CEO": "Strategic executive access to command center, financial health, performance, AI briefings, and scenarios.",
            "CFO": "Full finance access to dashboards, explorer, AI CFO, scenarios, and control-center review surfaces.",
            "Finance Manager": "Operational finance access to cash, receivables, invoices, and authorized explorer data.",
            "Department Manager": "Department-scoped command-center and performance visibility.",
            "Sales Manager": "Sales performance, order explorer, and authorized intelligence visibility.",
            "Analyst": "Read-only financial dashboards and explorer access within an assigned data scope.",
        }
        return [
            RolePublic(
                name=role,
                permissions=[permission.value for permission in sorted(permissions)],
                description=descriptions.get(role, "Custom role"),
                protected=role in descriptions,
            )
            for role, permissions in ROLE_PERMISSIONS.items()
        ]

    def create_invitation(
        self,
        *,
        context: RequestContext,
        settings: Settings,
        email: str,
        role: str,
        data_scope: str,
        note: str | None,
    ) -> InvitationPublic:
        context.require(Permission.ADMIN_INVITATIONS_CREATE, Permission.ADMIN_MEMBERS_MANAGE)
        normalized_email = normalize_email(email)
        if role not in ROLE_PERMISSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "invalid_role", "message": "Selected role is not available."},
            )
        existing_user = self._find_user_by_email(normalized_email)
        if existing_user and existing_user.tenant_id == context.tenant.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "member_exists", "message": "This user is already a member."},
            )

        created_at = utc_now()
        raw_token = new_token("invitation")
        invitation = InvitationRecord(
            id=new_token("invite"),
            tenant_id=context.tenant.id,
            email=normalized_email,
            role=role,
            data_scope=data_scope,
            invited_by_user_id=context.user.id,
            token_hash=hash_token(raw_token),
            created_at=created_at,
            expires_at=created_at + timedelta(seconds=settings.invitation_token_seconds),
            status="email_queued",
        )
        self.invitations[invitation.id] = invitation
        invitation_url = f"{settings.public_app_url}/invite?token={quote(raw_token)}"
        delivery_status = email_service.send_invitation(
            settings=settings,
            to_email=invitation.email,
            organization_name=context.tenant.name,
            role=invitation.role,
            invitation_url=invitation_url,
        )
        invitation.status = delivery_status
        self._audit("INVITATION_CREATED", context.user.id, context.tenant.id)
        if note:
            self._audit("INVITATION_NOTE_ATTACHED", context.user.id, context.tenant.id)
        return self._invitation_public(invitation, invitation_url=invitation_url)

    def list_invitations(self, context: RequestContext, settings: Settings) -> list[InvitationPublic]:
        context.require(Permission.ADMIN_MEMBERS_MANAGE)
        return [
            self._invitation_public(invitation)
            for invitation in self.invitations.values()
            if invitation.tenant_id == context.tenant.id
        ]

    def accept_invitation(
        self,
        *,
        token: str,
        first_name: str,
        last_name: str,
        password: str,
    ) -> AuthenticatedUserResponse:
        invitation = next(
            (
                item
                for item in self.invitations.values()
                if item.token_hash == hash_token(token)
            ),
            None,
        )
        if (
            not invitation
            or invitation.status in {"accepted", "expired", "revoked"}
            or utc_now() >= invitation.expires_at
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "invalid_invitation", "message": "Invitation is invalid or expired."},
            )
        if self._find_user_by_email(invitation.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "member_exists", "message": "An account already exists for this email."},
            )
        user = UserRecord(
            id=new_token("user"),
            tenant_id=invitation.tenant_id,
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            email=invitation.email,
            password_hash=hash_password(password),
            role=invitation.role,
            data_scope=invitation.data_scope,
            email_verified=True,
        )
        self.users[user.id] = user
        invitation.status = "accepted"
        self._audit("INVITATION_ACCEPTED", user.id, user.tenant_id)
        return self._auth_response(user, access_token=None, expires_at=None)

    def _issue_email_verification(self, user: UserRecord, settings: Settings) -> None:
        raw_token = new_token("email_verification")
        self.email_verification_tokens[hash_token(raw_token)] = OneTimeTokenRecord(
            user_id=user.id,
            expires_at=utc_now() + timedelta(hours=24),
        )
        verification_url = f"{settings.public_app_url}/verify-email?token={quote(raw_token)}"
        email_service.send_verification(
            settings=settings,
            to_email=user.email,
            verification_url=verification_url,
        )

    def _find_user_by_email(self, email: str) -> UserRecord | None:
        for user in self.users.values():
            if user.email == email:
                return user
        return None

    def _find_session(self, *, access_token: str | None, session_id: str | None) -> SessionRecord | None:
        for session in self.sessions.values():
            if access_token and session.access_token == access_token:
                return session
            if session_id and session.id == session_id:
                return session
        return None

    def _auth_response(
        self,
        user: UserRecord,
        *,
        access_token: str | None,
        expires_at: datetime | None,
        mfa_verified: bool = True,
    ) -> AuthenticatedUserResponse:
        tenant = self.tenants[user.tenant_id]
        if not user.active:
            auth_state = "ACCOUNT_DISABLED"
        elif user.password_reset_required:
            auth_state = "PASSWORD_RESET_REQUIRED"
        elif not user.email_verified:
            auth_state = "EMAIL_UNVERIFIED"
        elif user.mfa_enabled and not mfa_verified:
            auth_state = "MFA_REQUIRED"
        else:
            auth_state = "AUTHENTICATED"
        permissions = []
        if auth_state == "AUTHENTICATED":
            permissions = [
                permission.value
                for permission in sorted(resolve_permissions(user.role, user.custom_permissions))
            ]

        return AuthenticatedUserResponse(
            user=UserPublic(
                id=user.id,
                firstName=user.first_name,
                lastName=user.last_name,
                email=user.email,
                emailVerified=user.email_verified,
                mfaEnabled=user.mfa_enabled,
            ),
            organization=OrganizationPublic(id=tenant.id, name=tenant.name),
            membership=MembershipPublic(role=user.role, dataScope=user.data_scope),
            permissions=permissions,
            authState=auth_state,
            accessToken=access_token,
            expiresAt=expires_at,
        )

    def _session_public(self, session: SessionRecord, current: bool) -> SessionPublic:
        return SessionPublic(
            id=session.id,
            device=session.device,
            location=session.location,
            createdAt=session.created_at,
            lastActiveAt=session.last_active_at,
            current=current,
            mfaVerified=session.mfa_verified,
        )

    def _member_public(self, user: UserRecord) -> MemberPublic:
        return MemberPublic(
            id=user.id,
            firstName=user.first_name,
            lastName=user.last_name,
            email=user.email,
            role=user.role,
            dataScope=user.data_scope,
            status="Active" if user.active else "Disabled",
            emailVerified=user.email_verified,
            mfaEnabled=user.mfa_enabled,
        )

    def _invitation_public(
        self,
        invitation: InvitationRecord,
        *,
        invitation_url: str | None = None,
    ) -> InvitationPublic:
        return InvitationPublic(
            id=invitation.id,
            email=invitation.email,
            role=invitation.role,
            dataScope=invitation.data_scope,
            invitedByUserId=invitation.invited_by_user_id,
            status=invitation.status,
            invitationUrl=invitation_url,
            createdAt=invitation.created_at,
            expiresAt=invitation.expires_at,
        )

    def _audit(self, event_type: str, user_id: str, tenant_id: str) -> None:
        self.security_events.append(
            {
                "eventType": event_type,
                "userId": user_id,
                "tenantId": tenant_id,
                "timestamp": utc_now().isoformat(),
            }
        )


def normalize_email(email: str) -> str:
    return email.strip().lower()


def compact_user_agent(user_agent: str | None) -> str:
    if not user_agent:
        return "Unknown device"
    if "Windows" in user_agent:
        return "Windows desktop"
    if "Macintosh" in user_agent:
        return "Mac desktop"
    if "iPhone" in user_agent:
        return "iPhone"
    if "Android" in user_agent:
        return "Android"
    return "Browser session"


auth_service = AuthService()
