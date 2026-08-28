from __future__ import annotations

from typing import Annotated
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_context
from app.auth.permissions import Permission
from app.auth.service import RequestContext
from app.core.config import Settings, get_settings
from app.db.models import Connector, SyncRun
from app.db.session import get_db
from app.domain.bank_imports import BankCsvValidationError, bank_import_service
from app.domain.connectors import (
    ConnectorConfigurationError,
    ConnectorOAuthError,
    connector_service,
)

router = APIRouter(prefix="/connectors", tags=["connectors"])


class ConnectorPublic(BaseModel):
    id: str
    provider: str
    status: str
    syncMode: str
    externalAccountId: str | None
    lastSyncAt: str | None
    recordsProcessed: int
    errors: int


class SyncRunPublic(BaseModel):
    id: str
    connectorId: str
    status: str
    startedAt: str
    completedAt: str | None
    recordsProcessed: int
    message: str


class BankAccountPublic(BaseModel):
    id: str
    institutionName: str
    accountName: str
    accountNumberLast4: str | None
    currency: str
    currentBalanceCents: int | None
    lastTransactionAt: str | None
    transactionCount: int | None = None


class BankImportPublic(BaseModel):
    importId: str
    connectorId: str
    alreadyImported: bool
    fileName: str
    totalRows: int
    importedRows: int
    duplicateRows: int
    rejectedRows: int
    mapping: dict[str, str]
    importedAt: str
    account: BankAccountPublic


class RecentBankImportPublic(BaseModel):
    id: str
    fileName: str
    accountName: str
    status: str
    totalRows: int
    importedRows: int
    duplicateRows: int
    createdAt: str


class BankOverviewPublic(BaseModel):
    connectorId: str | None
    accounts: list[BankAccountPublic]
    recentImports: list[RecentBankImportPublic]


@router.get("", response_model=list[ConnectorPublic])
def list_connectors(
    context: RequestContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> list[ConnectorPublic]:
    context.require(Permission.INTEGRATION_MANAGE)
    return [
        connector_public(connector)
        for connector in connector_service.list_connectors(db, context.tenant.id)
    ]


@router.post("/crm/{provider}/oauth/start")
def start_crm_oauth(
    provider: str,
    context: RequestContext = Depends(get_current_context),
    settings: Settings = Depends(get_settings),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    context.require(Permission.INTEGRATION_MANAGE)
    try:
        return connector_service.start_crm_oauth(
            db=db,
            context=context,
            provider=provider,
            settings=settings,
        )
    except ConnectorConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "connector_not_configured", "message": str(exc)},
        ) from exc


@router.get("/crm/{provider}/oauth/callback")
async def complete_crm_oauth(
    provider: str,
    state: str = "",
    code: str = "",
    error: str | None = None,
    error_description: str | None = None,
    settings: Settings = Depends(get_settings),
    db: Session = Depends(get_db),
) -> RedirectResponse:
    if error:
        message = error_description or "CRM authorization was declined."
        return _integration_redirect(settings, error=message)
    if not state or not code:
        return _integration_redirect(settings, error="CRM authorization response is incomplete.")
    try:
        connector = await connector_service.complete_crm_oauth(
            db=db,
            provider=provider,
            state=state,
            code=code,
            settings=settings,
        )
    except ConnectorOAuthError as exc:
        return _integration_redirect(settings, error=str(exc))
    return _integration_redirect(settings, connected=connector.provider)


@router.get("/crm/{provider}/schema")
async def discover_crm_schema(
    provider: str,
    context: RequestContext = Depends(get_current_context),
    settings: Settings = Depends(get_settings),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    context.require(Permission.INTEGRATION_MANAGE)
    try:
        schema = await connector_service.discover_schema(
            db=db,
            tenant_id=context.tenant.id,
            provider=provider,
            settings=settings,
        )
    except KeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connector not found.",
        ) from exc
    except (ConnectorConfigurationError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "schema_discovery_failed", "message": str(exc)},
        ) from exc
    return {"provider": schema.provider, "entities": schema.entities, "fields": schema.fields}


@router.get("/bank/overview", response_model=BankOverviewPublic)
def bank_overview(
    context: RequestContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> BankOverviewPublic:
    context.require(Permission.INTEGRATION_MANAGE)
    return BankOverviewPublic.model_validate(
        bank_import_service.overview(db, context.tenant.id)
    )


@router.post("/bank/csv/import", response_model=BankImportPublic)
async def import_bank_csv(
    file: Annotated[UploadFile, File(description="Bank statement CSV")],
    institution_name: Annotated[str, Form(alias="institutionName", min_length=2, max_length=180)],
    account_name: Annotated[str, Form(alias="accountName", min_length=2, max_length=180)],
    currency: Annotated[str, Form(min_length=3, max_length=3, pattern=r"^[A-Za-z]{3}$")] = "PKR",
    account_number_last4: Annotated[
        str | None,
        Form(alias="accountNumberLast4", pattern=r"^\d{4}$"),
    ] = None,
    context: RequestContext = Depends(get_current_context),
    settings: Settings = Depends(get_settings),
    db: Session = Depends(get_db),
) -> BankImportPublic:
    context.require(Permission.INTEGRATION_MANAGE)
    file_name = _safe_csv_file_name(file.filename)
    content_type = (file.content_type or "").lower()
    allowed_content_types = {
        "",
        "application/csv",
        "application/octet-stream",
        "application/vnd.ms-excel",
        "text/csv",
        "text/plain",
    }
    if content_type not in allowed_content_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail={"code": "invalid_bank_file_type", "message": "Select a CSV bank statement."},
        )
    try:
        content = await file.read(settings.bank_csv_max_bytes + 1)
    finally:
        await file.close()
    if len(content) > settings.bank_csv_max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={
                "code": "bank_file_too_large",
                "message": (
                    f"The bank statement exceeds the {settings.bank_csv_max_bytes // (1024 * 1024)} MB limit."
                ),
            },
        )
    try:
        result = bank_import_service.import_statement(
            db=db,
            context=context,
            file_name=file_name,
            content=content,
            institution_name=institution_name.strip(),
            account_name=account_name.strip(),
            account_number_last4=account_number_last4,
            currency=currency.upper(),
            max_rows=settings.bank_csv_max_rows,
        )
    except BankCsvValidationError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "code": "invalid_bank_statement",
                "message": str(exc),
                "rowErrors": exc.row_errors,
            },
        ) from exc
    return BankImportPublic.model_validate(result)


@router.post("/{connector_id}/sync-runs", response_model=SyncRunPublic)
def start_sync(
    connector_id: str,
    context: RequestContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> SyncRunPublic:
    context.require(Permission.INTEGRATION_MANAGE)
    try:
        run = connector_service.start_sync(
            db=db,
            tenant_id=context.tenant.id,
            connector_id=connector_id,
        )
        return sync_run_public(run)
    except KeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connector not found.",
        ) from exc
    except ConnectorConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "sync_worker_unavailable", "message": str(exc)},
        ) from exc


@router.get("/sync-runs/{run_id}", response_model=SyncRunPublic)
def get_sync_run(
    run_id: str,
    context: RequestContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> SyncRunPublic:
    context.require(Permission.INTEGRATION_MANAGE)
    try:
        return sync_run_public(
            connector_service.get_sync_run(
                db=db,
                tenant_id=context.tenant.id,
                run_id=run_id,
            )
        )
    except KeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sync run not found.",
        ) from exc


@router.delete("/{connector_id}", status_code=status.HTTP_204_NO_CONTENT)
def disconnect(
    connector_id: str,
    context: RequestContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> None:
    context.require(Permission.INTEGRATION_MANAGE)
    try:
        connector_service.disconnect(
            db=db,
            tenant_id=context.tenant.id,
            connector_id=connector_id,
        )
    except KeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connector not found.",
        ) from exc


def connector_public(connector: Connector) -> ConnectorPublic:
    return ConnectorPublic(
        id=connector.id,
        provider=connector.provider,
        status=connector.status.value,
        syncMode=connector.sync_mode,
        externalAccountId=connector.external_account_id,
        lastSyncAt=connector.last_sync_at.isoformat() if connector.last_sync_at else None,
        recordsProcessed=connector.records_processed,
        errors=connector.errors,
    )


def sync_run_public(run: SyncRun) -> SyncRunPublic:
    return SyncRunPublic(
        id=run.id,
        connectorId=run.connector_id,
        status=run.status.value,
        startedAt=run.started_at.isoformat(),
        completedAt=run.completed_at.isoformat() if run.completed_at else None,
        recordsProcessed=run.records_processed,
        message=run.message,
    )


def _integration_redirect(
    settings: Settings,
    *,
    connected: str | None = None,
    error: str | None = None,
) -> RedirectResponse:
    query = urlencode(
        {key: value for key, value in {"connected": connected, "oauthError": error}.items() if value}
    )
    return RedirectResponse(
        url=f"{settings.public_app_url}/integrations?{query}",
        status_code=status.HTTP_303_SEE_OTHER,
    )


def _safe_csv_file_name(value: str | None) -> str:
    file_name = (value or "bank-statement.csv").replace("\\", "/").rsplit("/", 1)[-1].strip()
    if not file_name.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail={"code": "invalid_bank_file_type", "message": "Select a .csv bank statement."},
        )
    if len(file_name) > 255:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={"code": "invalid_bank_file_name", "message": "The file name is too long."},
        )
    return file_name
