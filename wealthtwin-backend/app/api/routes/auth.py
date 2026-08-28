from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, Response, status

from app.api.dependencies import clear_session_cookie, get_current_context, set_session_cookie
from app.auth.schemas import (
    AuthenticatedUserResponse,
    ChangePasswordRequest,
    EmailRequest,
    GenericMessage,
    InvitationAcceptRequest,
    LoginRequest,
    MfaVerifyRequest,
    RegisterRequest,
    ResetPasswordRequest,
    SessionPublic,
    VerifyEmailRequest,
)
from app.auth.service import RequestContext, auth_service
from app.core.config import Settings, get_settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthenticatedUserResponse)
def register(
    payload: RegisterRequest,
    settings: Settings = Depends(get_settings),
) -> AuthenticatedUserResponse:
    return auth_service.register(
        first_name=payload.firstName,
        last_name=payload.lastName,
        email=payload.email,
        password=payload.password,
        organization_name=payload.organizationName,
        accepted_terms=payload.acceptedTerms,
        settings=settings,
    )


@router.post("/login", response_model=AuthenticatedUserResponse)
def login(
    payload: LoginRequest,
    response: Response,
    settings: Settings = Depends(get_settings),
    user_agent: str | None = Header(default=None),
) -> AuthenticatedUserResponse:
    auth_response, session = auth_service.login(
        email=payload.email,
        password=payload.password,
        remember_device=payload.rememberDevice,
        user_agent=user_agent,
    )
    set_session_cookie(response, session.id, settings)
    return auth_response


@router.post("/logout", response_model=GenericMessage)
def logout(
    response: Response,
    context: RequestContext = Depends(get_current_context),
    settings: Settings = Depends(get_settings),
) -> GenericMessage:
    auth_service.logout(context)
    clear_session_cookie(response, settings)
    return GenericMessage(message="Signed out.")


@router.post("/refresh", response_model=AuthenticatedUserResponse)
def refresh(
    response: Response,
    context: RequestContext = Depends(get_current_context),
    settings: Settings = Depends(get_settings),
) -> AuthenticatedUserResponse:
    auth_response, session = auth_service.refresh(context)
    set_session_cookie(response, session.id, settings)
    return auth_response


@router.get("/me", response_model=AuthenticatedUserResponse)
def me(context: RequestContext = Depends(get_current_context)) -> AuthenticatedUserResponse:
    return auth_service.me(context)


@router.post("/verify-email", response_model=GenericMessage)
def verify_email(payload: VerifyEmailRequest) -> GenericMessage:
    auth_service.verify_email(payload.token)
    return GenericMessage(message="Email verified successfully.")


@router.post("/resend-verification", response_model=GenericMessage)
def resend_verification(
    payload: EmailRequest,
    settings: Settings = Depends(get_settings),
) -> GenericMessage:
    auth_service.resend_verification(payload.email, settings)
    return GenericMessage(message="If verification is available, an email will be sent.")


@router.post("/forgot-password", response_model=GenericMessage)
def forgot_password(
    payload: EmailRequest,
    settings: Settings = Depends(get_settings),
) -> GenericMessage:
    auth_service.request_password_reset(payload.email, settings)
    return GenericMessage(message="If recovery is available, password reset instructions will be sent.")


@router.post("/reset-password", response_model=GenericMessage)
def reset_password(payload: ResetPasswordRequest) -> GenericMessage:
    auth_service.reset_password(payload.token, payload.newPassword)
    return GenericMessage(message="Password reset successfully.")


@router.post("/change-password", response_model=GenericMessage)
def change_password(
    payload: ChangePasswordRequest,
    context: RequestContext = Depends(get_current_context),
) -> GenericMessage:
    auth_service.change_password(context, payload.currentPassword, payload.newPassword)
    return GenericMessage(message="Password changed.")


@router.post("/mfa/setup")
def setup_mfa(context: RequestContext = Depends(get_current_context)) -> dict[str, object]:
    return auth_service.setup_mfa(context)


@router.post("/mfa/enable")
def enable_mfa(
    payload: MfaVerifyRequest,
    context: RequestContext = Depends(get_current_context),
) -> dict[str, object]:
    recovery_codes = auth_service.enable_mfa(context, payload.code)
    return {"message": "MFA enabled.", "recoveryCodes": recovery_codes}


@router.post("/mfa/verify", response_model=GenericMessage)
def verify_mfa(
    payload: MfaVerifyRequest,
    context: RequestContext = Depends(get_current_context),
) -> GenericMessage:
    auth_service.verify_mfa(context, payload.code)
    return GenericMessage(message="MFA verified.")


@router.post("/mfa/disable", response_model=GenericMessage)
def disable_mfa(context: RequestContext = Depends(get_current_context)) -> GenericMessage:
    auth_service.disable_mfa(context)
    return GenericMessage(message="MFA disabled.")


@router.post("/mfa/recovery-codes/regenerate")
def regenerate_recovery_codes(context: RequestContext = Depends(get_current_context)) -> dict[str, object]:
    return {"recoveryCodes": auth_service.regenerate_recovery_codes(context)}


@router.post("/invitations/accept", response_model=AuthenticatedUserResponse)
def accept_invitation(payload: InvitationAcceptRequest) -> AuthenticatedUserResponse:
    return auth_service.accept_invitation(
        token=payload.token,
        first_name=payload.firstName,
        last_name=payload.lastName,
        password=payload.password,
    )


@router.get("/sessions", response_model=list[SessionPublic])
def sessions(context: RequestContext = Depends(get_current_context)) -> list[SessionPublic]:
    return auth_service.list_sessions(context)


@router.delete("/sessions/{session_id}", response_model=GenericMessage)
def revoke_session(
    session_id: str,
    context: RequestContext = Depends(get_current_context),
) -> GenericMessage:
    auth_service.revoke_session(context, session_id)
    return GenericMessage(message="Session revoked.")


@router.post("/sessions/revoke-all", response_model=GenericMessage)
def revoke_all_sessions(context: RequestContext = Depends(get_current_context)) -> GenericMessage:
    auth_service.revoke_other_sessions(context)
    return GenericMessage(message="Other sessions revoked.")


@router.get("/oauth/{provider}/start")
def oauth_start(provider: str) -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail={
            "code": "oauth_sign_in_unavailable",
            "message": f"{provider.title()} sign-in is not configured for this deployment.",
        },
    )


@router.get("/oauth/{provider}/callback", response_model=GenericMessage)
def oauth_callback(provider: str) -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail={
            "code": "oauth_sign_in_unavailable",
            "message": f"{provider.title()} sign-in is not configured for this deployment.",
        },
    )
