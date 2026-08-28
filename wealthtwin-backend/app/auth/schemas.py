from __future__ import annotations

import re
from datetime import datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, Field


def validate_password_policy(password: str) -> str:
    requirements = (
        (len(password) >= 12, "at least 12 characters"),
        (bool(re.search(r"[A-Z]", password)), "an uppercase letter"),
        (bool(re.search(r"[a-z]", password)), "a lowercase letter"),
        (bool(re.search(r"[0-9]", password)), "a number"),
        (bool(re.search(r"[^A-Za-z0-9\s]", password)), "a special character"),
    )
    missing = [label for passed, label in requirements if not passed]
    if missing:
        raise ValueError(f"Password must contain {', '.join(missing)}.")
    return password


SecurePassword = Annotated[
    str,
    Field(min_length=12, max_length=256),
    AfterValidator(validate_password_policy),
]


class UserPublic(BaseModel):
    id: str
    firstName: str
    lastName: str
    email: str
    emailVerified: bool
    mfaEnabled: bool


class OrganizationPublic(BaseModel):
    id: str
    name: str


class MembershipPublic(BaseModel):
    role: str
    dataScope: str


class AuthenticatedUserResponse(BaseModel):
    user: UserPublic
    organization: OrganizationPublic
    membership: MembershipPublic
    permissions: list[str]
    authState: Literal[
        "AUTHENTICATED",
        "EMAIL_UNVERIFIED",
        "MFA_REQUIRED",
        "ACCOUNT_DISABLED",
        "PASSWORD_RESET_REQUIRED",
    ]
    accessToken: str | None = None
    expiresAt: datetime | None = None


class RegisterRequest(BaseModel):
    firstName: str = Field(min_length=1, max_length=80)
    lastName: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=3, max_length=255)
    password: SecurePassword
    organizationName: str | None = Field(default=None, max_length=160)
    acceptedTerms: bool


class LoginRequest(BaseModel):
    email: str
    password: str
    rememberDevice: bool = False


class GenericMessage(BaseModel):
    message: str


class VerifyEmailRequest(BaseModel):
    token: str


class EmailRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    newPassword: SecurePassword


class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: SecurePassword


class MfaVerifyRequest(BaseModel):
    code: str = Field(min_length=6, max_length=12)


class SessionPublic(BaseModel):
    id: str
    device: str
    location: str
    createdAt: datetime
    lastActiveAt: datetime
    current: bool
    mfaVerified: bool


class OAuthStartResponse(BaseModel):
    authorizationUrl: str
    state: str


class MemberPublic(BaseModel):
    id: str
    firstName: str
    lastName: str
    email: str
    role: str
    dataScope: str
    status: str
    emailVerified: bool
    mfaEnabled: bool


class RolePublic(BaseModel):
    name: str
    permissions: list[str]
    description: str
    protected: bool = True


class InvitationCreateRequest(BaseModel):
    email: str
    role: str
    dataScope: str = Field(min_length=1, max_length=180)
    note: str | None = Field(default=None, max_length=500)


class InvitationAcceptRequest(BaseModel):
    token: str = Field(min_length=20, max_length=512)
    firstName: str = Field(min_length=1, max_length=80)
    lastName: str = Field(min_length=1, max_length=80)
    password: SecurePassword


class InvitationPublic(BaseModel):
    id: str
    email: str
    role: str
    dataScope: str
    invitedByUserId: str
    status: str
    invitationUrl: str | None = None
    createdAt: datetime
    expiresAt: datetime
