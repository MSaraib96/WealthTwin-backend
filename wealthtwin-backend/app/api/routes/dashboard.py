from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_context
from app.auth.permissions import Permission
from app.auth.service import RequestContext
from app.db.session import get_db
from app.domain.financial_data import (
    cash_forecast_response,
    command_center_response,
    compare_scenario_response,
    control_center_response,
    explorer_sales_orders_response,
    financial_health_response,
    intelligence_response,
    performance_response,
)

router = APIRouter(tags=["protected"])


@router.get("/dashboard/command-center")
def command_center(
    context: RequestContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    context.require(Permission.DASHBOARD_COMMAND_CENTER_VIEW)
    return command_center_response(db, context)


@router.get("/financial-health")
def financial_health(
    context: RequestContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    context.require(Permission.DASHBOARD_FINANCIAL_HEALTH_VIEW)
    return financial_health_response(db, context)


@router.get("/cash/forecast")
def cash_forecast(
    context: RequestContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    context.require(Permission.DASHBOARD_CASH_VIEW, Permission.METRIC_CASH_VIEW)
    return cash_forecast_response(db, context)


@router.get("/performance")
def performance(
    context: RequestContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    context.require(Permission.DASHBOARD_PERFORMANCE_VIEW)
    return performance_response(db, context)


@router.get("/intelligence")
def intelligence(
    context: RequestContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    context.require(Permission.FEATURE_INTELLIGENCE_CENTER_VIEW)
    return intelligence_response(db, context)


@router.get("/notifications")
def notifications(
    context: RequestContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    context.require(Permission.FEATURE_INTELLIGENCE_CENTER_VIEW)
    alerts = intelligence_response(db, context)["alerts"]
    return {"tenantId": context.tenant.id, "unread": len(alerts), "items": alerts}


@router.get("/explorer/sales-orders")
def explorer_sales_orders(
    context: RequestContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    context.require(Permission.EXPLORER_SALES_ORDERS_VIEW)
    return explorer_sales_orders_response(db, context)


@router.get("/control-center/overview")
def control_center(
    context: RequestContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    context.require(Permission.ADMIN_CONTROL_CENTER_VIEW)
    return control_center_response(db, context)


class ScenarioRequest(BaseModel):
    scenarioName: str
    assumptions: dict[str, float | int | str | bool] = Field(default_factory=dict)


@router.post("/scenarios/compare")
def compare_scenario(
    payload: ScenarioRequest,
    context: RequestContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    context.require(Permission.FEATURE_SCENARIO_SIMULATOR_USE)
    return compare_scenario_response(db, context, payload.scenarioName, payload.assumptions)
