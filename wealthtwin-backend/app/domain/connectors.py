from __future__ import annotations

import base64
import hashlib
import re
import secrets
from datetime import UTC, datetime, timedelta

from celery.exceptions import CeleryError
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.auth.service import RequestContext
from app.connectors.base import ConnectorSchema, ProviderSyncResult
from app.connectors.crm import crm_connector
from app.core.config import Settings
from app.core.credentials import CredentialCipher, CredentialEncryptionError
from app.core.security import hash_token, new_token, utc_now
from app.db.models import (
    BankAccount,
    BankStatementImport,
    BankTransaction,
    Connector,
    ConnectorCredential,
    ConnectorStatus,
    Customer,
    OAuthState,
    SalesOrder,
    SyncRun,
    SyncStatus,
    Tenant,
)


class ConnectorConfigurationError(ValueError):
    pass


class ConnectorOAuthError(ValueError):
    pass


class ConnectorService:
    def list_connectors(self, db: Session, tenant_id: str) -> list[Connector]:
        return list(
            db.scalars(
                select(Connector)
                .where(Connector.tenant_id == tenant_id)
                .order_by(Connector.created_at.asc())
            ).all()
        )

    def start_crm_oauth(
        self,
        *,
        db: Session,
        context: RequestContext,
        provider: str,
        settings: Settings,
    ) -> dict[str, str]:
        try:
            cipher = CredentialCipher.from_settings(settings)
            connector = crm_connector(provider, settings)
        except (CredentialEncryptionError, ValueError) as exc:
            raise ConnectorConfigurationError(str(exc)) from exc

        self.ensure_tenant(db, context)
        raw_state = new_token("crm_state")
        code_verifier: str | None = None
        code_challenge: str | None = None
        if connector.provider == "salesforce":
            code_verifier = secrets.token_urlsafe(64)
            digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
            code_challenge = base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")

        oauth_state = OAuthState(
            state_hash=hash_token(raw_state),
            tenant_id=context.tenant.id,
            user_id=context.user.id,
            provider=connector.provider,
            encrypted_code_verifier=(
                cipher.encrypt({"code_verifier": code_verifier}) if code_verifier else None
            ),
            expires_at=utc_now() + timedelta(seconds=settings.oauth_state_seconds),
        )
        db.add(oauth_state)
        db.commit()
        try:
            authorization_url = connector.authorization_url(
                state=raw_state,
                code_challenge=code_challenge,
            )
        except ValueError as exc:
            db.delete(oauth_state)
            db.commit()
            raise ConnectorConfigurationError(str(exc)) from exc
        return {
            "provider": connector.provider,
            "state": raw_state,
            "authorizationUrl": authorization_url,
            "tenantId": context.tenant.id,
        }

    async def complete_crm_oauth(
        self,
        *,
        db: Session,
        provider: str,
        state: str,
        code: str,
        settings: Settings,
    ) -> Connector:
        try:
            cipher = CredentialCipher.from_settings(settings)
            provider_connector = crm_connector(provider, settings)
        except (CredentialEncryptionError, ValueError) as exc:
            raise ConnectorOAuthError(str(exc)) from exc

        oauth_state = db.scalar(
            select(OAuthState).where(
                OAuthState.state_hash == hash_token(state),
                OAuthState.provider == provider_connector.provider,
            )
        )
        if (
            not oauth_state
            or oauth_state.consumed_at is not None
            or _as_utc(oauth_state.expires_at) <= utc_now()
        ):
            raise ConnectorOAuthError("The CRM authorization request is invalid or expired.")

        code_verifier = None
        if oauth_state.encrypted_code_verifier:
            verifier_payload = cipher.decrypt(oauth_state.encrypted_code_verifier)
            code_verifier_value = verifier_payload.get("code_verifier")
            code_verifier = str(code_verifier_value) if code_verifier_value else None

        oauth_state.consumed_at = utc_now()
        db.commit()
        try:
            credentials = await provider_connector.exchange_code(
                code=code,
                code_verifier=code_verifier,
            )
        except Exception as exc:
            raise ConnectorOAuthError(
                "The CRM provider rejected the authorization-code exchange."
            ) from exc

        connector = db.scalar(
            select(Connector).where(
                Connector.tenant_id == oauth_state.tenant_id,
                Connector.provider == provider_connector.provider,
            )
        )
        if not connector:
            connector = Connector(
                tenant_id=oauth_state.tenant_id,
                provider=provider_connector.provider,
                status=ConnectorStatus.connected,
                sync_mode="incremental",
                credentials_ref="database:connector_credentials",
                schema_snapshot={},
                sync_cursor={},
                records_processed=0,
                errors=0,
            )
            db.add(connector)
            db.flush()
        else:
            connector.status = ConnectorStatus.connected
            connector.credentials_ref = "database:connector_credentials"
            connector.errors = 0

        account_id = credentials.get("external_account_id")
        connector.external_account_id = str(account_id) if account_id else None
        credential = db.scalar(
            select(ConnectorCredential).where(
                ConnectorCredential.connector_id == connector.id
            )
        )
        encrypted_payload = cipher.encrypt(credentials)
        if credential:
            credential.encrypted_payload = encrypted_payload
            credential.updated_at = utc_now()
        else:
            db.add(
                ConnectorCredential(
                    connector_id=connector.id,
                    encrypted_payload=encrypted_payload,
                    key_version="v1",
                )
            )
        db.commit()
        db.refresh(connector)
        return connector

    async def discover_schema(
        self,
        *,
        db: Session,
        tenant_id: str,
        provider: str,
        settings: Settings,
    ) -> ConnectorSchema:
        connector = self._get_connector_by_provider(db, tenant_id, provider)
        credential, credentials, cipher = self._credentials(db, connector, settings)
        provider_connector = crm_connector(provider, settings)
        schema = await provider_connector.discover_schema(credentials)
        credential.encrypted_payload = cipher.encrypt(credentials)
        credential.updated_at = utc_now()
        connector.schema_snapshot = {
            "provider": schema.provider,
            "entities": schema.entities,
            "fields": schema.fields,
            "discoveredAt": utc_now().isoformat(),
        }
        db.commit()
        return schema

    def start_sync(
        self,
        *,
        db: Session,
        tenant_id: str,
        connector_id: str,
    ) -> SyncRun:
        connector = db.scalar(
            select(Connector).where(
                Connector.id == connector_id,
                Connector.tenant_id == tenant_id,
            )
        )
        if not connector:
            raise KeyError("Connector not found")
        active_run = db.scalar(
            select(SyncRun).where(
                SyncRun.connector_id == connector.id,
                SyncRun.status.in_([SyncStatus.queued, SyncStatus.running]),
            )
        )
        if active_run:
            return active_run

        run = SyncRun(
            tenant_id=tenant_id,
            connector_id=connector.id,
            status=SyncStatus.queued,
            started_at=utc_now(),
            records_processed=0,
            message="Synchronization queued.",
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        try:
            from app.tasks.sync import sync_connector

            sync_connector.delay(run.id)
        except (CeleryError, OSError) as exc:
            run.status = SyncStatus.failed
            run.completed_at = utc_now()
            run.message = "The synchronization worker is unavailable."
            connector.status = ConnectorStatus.sync_error
            connector.errors += 1
            db.commit()
            raise ConnectorConfigurationError(run.message) from exc
        return run

    def get_sync_run(self, *, db: Session, tenant_id: str, run_id: str) -> SyncRun:
        run = db.scalar(
            select(SyncRun).where(
                SyncRun.id == run_id,
                SyncRun.tenant_id == tenant_id,
            )
        )
        if not run:
            raise KeyError("Sync run not found")
        return run

    async def execute_sync(self, db: Session, run_id: str, settings: Settings) -> SyncRun:
        run = db.get(SyncRun, run_id)
        if not run:
            raise KeyError("Sync run not found")
        connector = db.get(Connector, run.connector_id)
        if not connector:
            raise KeyError("Connector not found")

        run.status = SyncStatus.running
        run.message = "Synchronization in progress."
        connector.status = ConnectorStatus.connected
        db.commit()
        try:
            credential, credentials, cipher = self._credentials(db, connector, settings)
            provider_connector = crm_connector(connector.provider, settings)
            result = await provider_connector.sync_incremental(
                credentials,
                connector.sync_cursor or {},
            )
            self._persist_sync_result(db, connector, result)
            credential.encrypted_payload = cipher.encrypt(result.credentials)
            credential.updated_at = utc_now()
            connector.sync_cursor = result.cursor
            connector.last_sync_at = utc_now()
            connector.records_processed += result.record_count
            connector.status = ConnectorStatus.connected
            run.status = SyncStatus.completed
            run.completed_at = utc_now()
            run.records_processed = result.record_count
            run.message = f"Synchronized {result.record_count:,} CRM records."
            db.commit()
        except Exception as exc:
            db.rollback()
            run = db.get(SyncRun, run_id)
            connector = db.get(Connector, run.connector_id) if run else None
            if run:
                run.status = SyncStatus.failed
                run.completed_at = utc_now()
                run.message = _safe_error_message(exc)
            if connector:
                connector.status = ConnectorStatus.sync_error
                connector.errors += 1
            db.commit()
            raise
        return run

    def disconnect(self, *, db: Session, tenant_id: str, connector_id: str) -> None:
        connector = db.scalar(
            select(Connector).where(
                Connector.id == connector_id,
                Connector.tenant_id == tenant_id,
            )
        )
        if not connector:
            raise KeyError("Connector not found")
        account_ids = select(BankAccount.id).where(
            BankAccount.connector_id == connector.id
        )
        db.execute(
            delete(BankTransaction).where(
                BankTransaction.bank_account_id.in_(account_ids)
            )
        )
        db.execute(
            delete(BankStatementImport).where(
                BankStatementImport.connector_id == connector.id
            )
        )
        db.execute(
            delete(BankAccount).where(BankAccount.connector_id == connector.id)
        )
        db.execute(delete(SyncRun).where(SyncRun.connector_id == connector.id))
        db.execute(
            delete(ConnectorCredential).where(ConnectorCredential.connector_id == connector.id)
        )
        db.delete(connector)
        db.commit()

    def _credentials(
        self,
        db: Session,
        connector: Connector,
        settings: Settings,
    ) -> tuple[ConnectorCredential, dict[str, object], CredentialCipher]:
        credential = db.scalar(
            select(ConnectorCredential).where(
                ConnectorCredential.connector_id == connector.id
            )
        )
        if not credential:
            raise ConnectorConfigurationError("Connector credentials are missing.")
        try:
            cipher = CredentialCipher.from_settings(settings)
            credentials = cipher.decrypt(credential.encrypted_payload)
        except CredentialEncryptionError as exc:
            raise ConnectorConfigurationError(str(exc)) from exc
        return credential, credentials, cipher

    def _get_connector_by_provider(
        self,
        db: Session,
        tenant_id: str,
        provider: str,
    ) -> Connector:
        normalized = provider.strip().lower()
        connector = db.scalar(
            select(Connector).where(
                Connector.tenant_id == tenant_id,
                Connector.provider == normalized,
            )
        )
        if not connector:
            raise KeyError("Connector not found")
        return connector

    def ensure_tenant(self, db: Session, context: RequestContext) -> None:
        if db.get(Tenant, context.tenant.id):
            return
        slug_base = re.sub(r"[^a-z0-9]+", "-", context.tenant.name.lower()).strip("-")
        db.add(
            Tenant(
                id=context.tenant.id,
                name=context.tenant.name,
                slug=f"{slug_base or 'organization'}-{context.tenant.id[-8:].lower()}",
            )
        )
        db.flush()

    def _persist_sync_result(
        self,
        db: Session,
        connector: Connector,
        result: ProviderSyncResult,
    ) -> None:
        customer_ids: dict[str, str] = {}
        for payload in result.customers:
            external_ref = str(payload["external_ref"])
            customer = db.scalar(
                select(Customer).where(
                    Customer.tenant_id == connector.tenant_id,
                    Customer.external_ref == external_ref,
                )
            )
            if not customer:
                customer = Customer(
                    tenant_id=connector.tenant_id,
                    external_ref=external_ref,
                    name=str(payload["name"]),
                )
                db.add(customer)
                db.flush()
            customer.name = str(payload["name"])
            customer.region = _optional_string(payload.get("region"))
            customer.business_unit = _optional_string(payload.get("business_unit"))
            customer.metadata_json = dict(payload.get("metadata", {}))
            customer_ids[external_ref] = customer.id

        for payload in result.sales_orders:
            external_ref = str(payload["external_ref"])
            order = db.scalar(
                select(SalesOrder).where(
                    SalesOrder.tenant_id == connector.tenant_id,
                    SalesOrder.external_ref == external_ref,
                )
            )
            if not order:
                order = SalesOrder(
                    tenant_id=connector.tenant_id,
                    external_ref=external_ref,
                    order_number=str(payload["order_number"]),
                    status=str(payload["status"]),
                )
                db.add(order)
            customer_ref = _optional_string(payload.get("customer_external_ref"))
            if customer_ref and customer_ref not in customer_ids:
                customer = db.scalar(
                    select(Customer).where(
                        Customer.tenant_id == connector.tenant_id,
                        Customer.external_ref == customer_ref,
                    )
                )
                if customer:
                    customer_ids[customer_ref] = customer.id
            order.customer_id = customer_ids.get(customer_ref) if customer_ref else None
            order.order_number = str(payload["order_number"])
            order.status = str(payload["status"])
            order.order_date = payload.get("order_date")
            order.total_amount_cents = int(payload.get("total_amount_cents", 0))
            order.currency = str(payload.get("currency", "USD"))[:3].upper()
            order.metadata_json = dict(payload.get("metadata", {}))


def _optional_string(value: object) -> str | None:
    return str(value) if value not in {None, ""} else None


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def _safe_error_message(error: Exception) -> str:
    name = type(error).__name__
    return f"CRM synchronization failed ({name}). Review worker logs and provider permissions."


connector_service = ConnectorService()
