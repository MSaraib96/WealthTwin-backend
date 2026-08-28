from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_context
from app.auth.schemas import InvitationCreateRequest, InvitationPublic, MemberPublic, RolePublic
from app.auth.service import RequestContext, auth_service
from app.core.config import Settings, get_settings

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/members", response_model=list[MemberPublic])
def list_members(context: RequestContext = Depends(get_current_context)) -> list[MemberPublic]:
    return auth_service.list_members(context)


@router.get("/roles", response_model=list[RolePublic])
def list_roles(context: RequestContext = Depends(get_current_context)) -> list[RolePublic]:
    return auth_service.list_roles(context)


@router.post("/invitations", response_model=InvitationPublic)
def create_invitation(
    payload: InvitationCreateRequest,
    context: RequestContext = Depends(get_current_context),
    settings: Settings = Depends(get_settings),
) -> InvitationPublic:
    return auth_service.create_invitation(
        context=context,
        settings=settings,
        email=payload.email,
        role=payload.role,
        data_scope=payload.dataScope,
        note=payload.note,
    )


@router.get("/invitations", response_model=list[InvitationPublic])
def list_invitations(
    context: RequestContext = Depends(get_current_context),
    settings: Settings = Depends(get_settings),
) -> list[InvitationPublic]:
    return auth_service.list_invitations(context, settings)
