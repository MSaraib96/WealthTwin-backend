from __future__ import annotations

import asyncio
from collections.abc import Iterator
from urllib.parse import parse_qs, urlparse

import pytest
from cryptography.fernet import Fernet
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth.service import auth_service
from app.connectors.base import ProviderSyncResult
from app.connectors.crm import SalesforceConnector
from app.core.config import Settings, get_settings
from app.core.email import email_service
from app.db.models import (
    BankAccount,
    BankStatementImport,
    BankTransaction,
    Base,
    ConnectorCredential,
    Customer,
    SalesOrder,
)
from app.db.session import get_db
from app.domain.connectors import connector_service
from app.main import create_app
from app.tasks.sync import sync_connector


@pytest.fixture
def client() -> Iterator[TestClient]:
    auth_service.__init__()
    email_service.outbox.clear()
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    testing_session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    settings = Settings(
        environment="test",
        database_url="sqlite://",
        public_app_url="http://testserver",
        allowed_origins=["http://testserver"],
        smtp_host=None,
        smtp_username=None,
        smtp_password=None,
        credential_encryption_key=Fernet.generate_key().decode("ascii"),
        crm_salesforce_client_id="salesforce-client-id",
        crm_salesforce_client_secret="salesforce-client-secret",
        crm_salesforce_redirect_uri=(
            "http://testserver/api/v1/connectors/crm/salesforce/oauth/callback"
        ),
    )
    app = create_app()

    def override_get_db():
        db = testing_session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_settings] = lambda: settings
    app.state.testing_session = testing_session
    app.state.testing_settings = settings
    with TestClient(app) as test_client:
        yield test_client


def create_verified_admin(client: TestClient, email: str = "owner@acme.test") -> str:
    registration = client.post(
        "/api/v1/auth/register",
        json={
            "firstName": "Organization",
            "lastName": "Owner",
            "email": email,
            "password": "A-secure-password-2026!",
            "organizationName": "Acme Operations",
            "acceptedTerms": True,
        },
    )
    assert registration.status_code == 200
    assert registration.json()["authState"] == "EMAIL_UNVERIFIED"

    verification_token = token_from_latest_email("token")
    verification = client.post(
        "/api/v1/auth/verify-email",
        json={"token": verification_token},
    )
    assert verification.status_code == 200

    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": "A-secure-password-2026!",
            "rememberDevice": False,
        },
    )
    assert login.status_code == 200
    assert login.json()["authState"] == "AUTHENTICATED"
    return login.json()["accessToken"]


def token_from_latest_email(parameter: str) -> str:
    url = email_service.outbox[-1].body.rsplit(" ", 1)[-1]
    value = parse_qs(urlparse(url).query).get(parameter, [None])[0]
    assert value
    return value


def test_registration_login_and_empty_dashboard(client: TestClient) -> None:
    token = create_verified_admin(client)
    headers = {"Authorization": f"Bearer {token}"}

    me = client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["organization"]["name"] == "Acme Operations"
    assert "dashboard.command_center.view" in me.json()["permissions"]

    dashboard = client.get("/api/v1/dashboard/command-center", headers=headers)
    assert dashboard.status_code == 200
    assert dashboard.json()["dataState"] == "empty"
    assert dashboard.json()["recordCount"] == 0
    assert "demoData" not in dashboard.json()


def test_admin_can_invite_member_with_role(client: TestClient) -> None:
    token = create_verified_admin(client)
    invitation = client.post(
        "/api/v1/admin/invitations",
        json={
            "email": "finance@acme.test",
            "role": "Finance Manager",
            "dataScope": "Finance operations",
            "note": "Join the finance workspace.",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert invitation.status_code == 200
    assert invitation.json()["email"] == "finance@acme.test"
    assert invitation.json()["role"] == "Finance Manager"
    assert invitation.json()["status"] == "stored_local_outbox"


def test_non_admin_cannot_invite_member(client: TestClient) -> None:
    admin_token = create_verified_admin(client)
    invitation = client.post(
        "/api/v1/admin/invitations",
        json={
            "email": "finance@acme.test",
            "role": "Finance Manager",
            "dataScope": "Finance operations",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert invitation.status_code == 200

    invitation_token = token_from_latest_email("token")
    acceptance = client.post(
        "/api/v1/auth/invitations/accept",
        json={
            "token": invitation_token,
            "firstName": "Finance",
            "lastName": "Manager",
            "password": "Another-secure-password-2026!",
        },
    )
    assert acceptance.status_code == 200

    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "finance@acme.test",
            "password": "Another-secure-password-2026!",
            "rememberDevice": False,
        },
    )
    member_token = login.json()["accessToken"]
    forbidden = client.post(
        "/api/v1/admin/invitations",
        json={
            "email": "another@acme.test",
            "role": "Analyst",
            "dataScope": "Finance operations",
        },
        headers={"Authorization": f"Bearer {member_token}"},
    )
    assert forbidden.status_code == 403


def test_protected_dashboard_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/v1/dashboard/command-center")
    assert response.status_code == 401


def test_unverified_user_cannot_access_protected_dashboard(client: TestClient) -> None:
    registration = client.post(
        "/api/v1/auth/register",
        json={
            "firstName": "Pending",
            "lastName": "Owner",
            "email": "pending@acme.test",
            "password": "A-secure-password-2026!",
            "organizationName": "Pending Operations",
            "acceptedTerms": True,
        },
    )
    assert registration.status_code == 200

    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "pending@acme.test",
            "password": "A-secure-password-2026!",
            "rememberDevice": False,
        },
    )
    assert login.status_code == 200
    assert login.json()["authState"] == "EMAIL_UNVERIFIED"

    dashboard = client.get(
        "/api/v1/dashboard/command-center",
        headers={"Authorization": f"Bearer {login.json()['accessToken']}"},
    )
    assert dashboard.status_code == 403
    assert dashboard.json()["detail"]["code"] == "email_verification_required"


def test_registration_rejects_weak_password_with_readable_error(client: TestClient) -> None:
    registration = client.post(
        "/api/v1/auth/register",
        json={
            "firstName": "Weak",
            "lastName": "Password",
            "email": "weak-password@acme.test",
            "password": "AAAAAAAAAAAA",
            "organizationName": "Password Validation",
            "acceptedTerms": True,
        },
    )
    assert registration.status_code == 422
    assert "lowercase letter" in registration.json()["detail"][0]["msg"]


def test_salesforce_oauth_encrypts_tokens_and_syncs_tenant_records(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    token = create_verified_admin(client)
    headers = {"Authorization": f"Bearer {token}"}

    async def exchange_code(
        self: SalesforceConnector,
        *,
        code: str,
        code_verifier: str | None = None,
    ) -> dict[str, object]:
        assert code == "provider-authorization-code"
        assert code_verifier
        return {
            "access_token": "provider-access-token",
            "refresh_token": "provider-refresh-token",
            "instance_url": "https://tenant.salesforce.test",
            "external_account_id": "salesforce-org-id",
        }

    monkeypatch.setattr(SalesforceConnector, "exchange_code", exchange_code)
    oauth_start = client.post(
        "/api/v1/connectors/crm/salesforce/oauth/start",
        headers=headers,
    )
    assert oauth_start.status_code == 200
    state = oauth_start.json()["state"]
    assert "code_challenge=" in oauth_start.json()["authorizationUrl"]

    callback = client.get(
        "/api/v1/connectors/crm/salesforce/oauth/callback",
        params={"state": state, "code": "provider-authorization-code"},
        follow_redirects=False,
    )
    assert callback.status_code == 303
    assert "connected=salesforce" in callback.headers["location"]

    replay = client.get(
        "/api/v1/connectors/crm/salesforce/oauth/callback",
        params={"state": state, "code": "provider-authorization-code"},
        follow_redirects=False,
    )
    assert replay.status_code == 303
    assert "oauthError=" in replay.headers["location"]

    connectors = client.get("/api/v1/connectors", headers=headers)
    assert connectors.status_code == 200
    connector = connectors.json()[0]
    assert connector["status"] == "connected"
    assert connector["externalAccountId"] == "salesforce-org-id"

    testing_session = client.app.state.testing_session
    with testing_session() as db:
        stored = db.scalar(select(ConnectorCredential))
        assert stored
        assert "provider-access-token" not in stored.encrypted_payload
        assert "provider-refresh-token" not in stored.encrypted_payload

    async def sync_incremental(
        self: SalesforceConnector,
        credentials: dict[str, object],
        cursor: dict[str, object],
    ) -> ProviderSyncResult:
        assert credentials["refresh_token"] == "provider-refresh-token"
        return ProviderSyncResult(
            customers=[
                {
                    "external_ref": "salesforce:Account:account-1",
                    "name": "Persisted Customer",
                    "region": "North",
                    "business_unit": "Enterprise",
                    "metadata": {"lastModifiedAt": "2026-08-24T00:00:00Z"},
                }
            ],
            sales_orders=[
                {
                    "external_ref": "salesforce:Opportunity:opportunity-1",
                    "customer_external_ref": "salesforce:Account:account-1",
                    "order_number": "Authorized Opportunity",
                    "status": "Closed Won",
                    "order_date": None,
                    "total_amount_cents": 125_000,
                    "currency": "USD",
                    "metadata": {"lastModifiedAt": "2026-08-24T00:00:00Z"},
                }
            ],
            cursor={"watermark": "2026-08-24T00:00:00Z"},
            credentials=credentials,
        )

    monkeypatch.setattr(SalesforceConnector, "sync_incremental", sync_incremental)
    monkeypatch.setattr(sync_connector, "delay", lambda run_id: None)
    started = client.post(
        f"/api/v1/connectors/{connector['id']}/sync-runs",
        headers=headers,
    )
    assert started.status_code == 200

    with testing_session() as db:
        asyncio.run(
            connector_service.execute_sync(
                db,
                started.json()["id"],
                client.app.state.testing_settings,
            )
        )
        assert len(db.scalars(select(Customer)).all()) == 1
        assert len(db.scalars(select(SalesOrder)).all()) == 1

    dashboard = client.get("/api/v1/dashboard/command-center", headers=headers)
    assert dashboard.status_code == 200
    assert dashboard.json()["dataState"] == "partial"
    assert dashboard.json()["recordCount"] == 2


def test_bank_csv_import_is_idempotent_and_updates_cash_workspace(client: TestClient) -> None:
    token = create_verified_admin(client)
    headers = {"Authorization": f"Bearer {token}"}
    statement = (
        "Transaction Date,Narration,Debit,Credit,Balance,Reference\n"
        "24/08/2026,Opening deposit,,100000.00,100000.00,TXN-1\n"
        '25/08/2026,Office rent,"25,000.00",,75000.00,TXN-2\n'
        "25/08/2026,Client receipt,,50000.00,125000.00,TXN-3\n"
    )
    form = {
        "institutionName": "Meezan Bank",
        "accountName": "Operating Account",
        "accountNumberLast4": "4321",
        "currency": "PKR",
    }

    imported = client.post(
        "/api/v1/connectors/bank/csv/import",
        headers=headers,
        data=form,
        files={"file": ("august-statement.csv", statement, "text/csv")},
    )
    assert imported.status_code == 200
    payload = imported.json()
    assert payload["alreadyImported"] is False
    assert payload["importedRows"] == 3
    assert payload["duplicateRows"] == 0
    assert payload["account"]["currentBalanceCents"] == 12_500_000
    assert payload["mapping"]["description"] == "Narration"

    duplicate = client.post(
        "/api/v1/connectors/bank/csv/import",
        headers=headers,
        data=form,
        files={"file": ("august-statement.csv", statement, "text/csv")},
    )
    assert duplicate.status_code == 200
    assert duplicate.json()["alreadyImported"] is True

    overview = client.get("/api/v1/connectors/bank/overview", headers=headers)
    assert overview.status_code == 200
    assert overview.json()["accounts"][0]["transactionCount"] == 3
    assert len(overview.json()["recentImports"]) == 1

    testing_session = client.app.state.testing_session
    with testing_session() as db:
        assert len(db.scalars(select(BankAccount)).all()) == 1
        assert len(db.scalars(select(BankStatementImport)).all()) == 1
        transactions = list(
            db.scalars(select(BankTransaction).order_by(BankTransaction.transaction_date)).all()
        )
        assert len(transactions) == 3
        assert [transaction.amount_cents for transaction in transactions] == [
            10_000_000,
            -2_500_000,
            5_000_000,
        ]

    cash = client.get("/api/v1/cash/forecast", headers=headers)
    assert cash.status_code == 200
    assert cash.json()["currentCash"] == "PKR 125.0K"
    assert cash.json()["entityCounts"]["bankAccounts"] == 1
    assert cash.json()["entityCounts"]["bankTransactions"] == 3


def test_bank_csv_rejects_unrecognized_columns_without_partial_import(
    client: TestClient,
) -> None:
    token = create_verified_admin(client)
    response = client.post(
        "/api/v1/connectors/bank/csv/import",
        headers={"Authorization": f"Bearer {token}"},
        data={
            "institutionName": "Test Bank",
            "accountName": "Operating Account",
            "currency": "PKR",
        },
        files={
            "file": (
                "invalid.csv",
                "When,What,Value\n25/08/2026,Unknown transaction,1000.00\n",
                "text/csv",
            )
        },
    )
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "invalid_bank_statement"

    testing_session = client.app.state.testing_session
    with testing_session() as db:
        assert len(db.scalars(select(BankTransaction)).all()) == 0
