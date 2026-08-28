from __future__ import annotations

from fastapi import Cookie, Depends, Header, Response

from app.auth.service import RequestContext, auth_service
from app.core.config import Settings, get_settings


def extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token


def get_current_context(
    settings: Settings = Depends(get_settings),
    authorization: str | None = Header(default=None),
    wt_session: str | None = Cookie(default=None),
) -> RequestContext:
    access_token = extract_bearer_token(authorization)
    return auth_service.authenticate(
        access_token=access_token,
        session_id=wt_session if wt_session else None,
    )


def set_session_cookie(response: Response, session_id: str, settings: Settings) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=session_id,
        httponly=True,
        secure=settings.environment not in {"local", "test"},
        samesite="lax",
        max_age=settings.access_token_seconds,
    )


def clear_session_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(key=settings.session_cookie_name, httponly=True, samesite="lax")
