from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.ai.gateway import AiGateway
from app.api.dependencies import get_current_context
from app.auth.permissions import Permission
from app.auth.service import RequestContext
from app.db.session import get_db
from app.domain.financial_data import privacy_filtered_ai_context

router = APIRouter(prefix="/ai", tags=["ai"])


class AiAskRequest(BaseModel):
    question: str = Field(min_length=3, max_length=1000)
    pageContext: str | None = Field(default=None, max_length=120)


@router.post("/ask")
async def ask_ai_cfo(
    payload: AiAskRequest,
    context: RequestContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    context.require(Permission.FEATURE_AI_CFO_USE)
    filtered_context = privacy_filtered_ai_context(db, context)
    gateway_result = await AiGateway().generate_executive_brief(
        question=payload.question,
        authorized_context=filtered_context,
    )
    return {
        "answerType": "executive_finance_analysis",
        "answer": gateway_result["text"],
        "question": payload.question,
        "pageContext": payload.pageContext,
        "evidence": filtered_context["authorizedMetrics"],
        "privacy": filtered_context["privacyFilter"],
        "modelProvider": gateway_result["provider"],
        "model": gateway_result["model"],
        "mode": gateway_result["mode"],
    }
