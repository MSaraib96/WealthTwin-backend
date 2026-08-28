# WealthTwin Backend

FastAPI backend foundation for WealthTwin. This repository owns authentication, authorization, tenant isolation, protected financial APIs, financial calculations, connector orchestration, and AI gateway access.

## MVP Scope Implemented

- Auth/session API shape from `WealthTwin.md` section 299
- Server-side permission checks for protected APIs
- Tenant context resolved from authenticated session, not browser-supplied tenant IDs
- Registration-created in-memory users, sessions, security events, and tenant context
- Tenant-scoped financial endpoints backed by persisted PostgreSQL records
- AI CFO endpoint behind permission and privacy-filtered context
- SQLAlchemy production schema and Alembic baseline migration
- Celery worker entrypoint for connector sync jobs
- Docker Compose stack for frontend, backend, Postgres, Redis, and worker

## Run Locally

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -e .[dev]
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Create the first organization through the frontend registration flow. No users or financial records are pre-seeded.

## Environment

Create `.env` in this backend repo for private settings:

```env
WEALTHTWIN_PUBLIC_APP_URL=http://127.0.0.1:3000
WEALTHTWIN_SMTP_HOST=
WEALTHTWIN_SMTP_USERNAME=
WEALTHTWIN_SMTP_PASSWORD=
WEALTHTWIN_SMTP_USE_TLS=true
WEALTHTWIN_CRM_SALESFORCE_CLIENT_ID=
WEALTHTWIN_CRM_SALESFORCE_CLIENT_SECRET=
WEALTHTWIN_CRM_SALESFORCE_REDIRECT_URI=http://localhost:8000/api/v1/connectors/crm/salesforce/oauth/callback
WEALTHTWIN_CRM_SALESFORCE_LOGIN_URL=https://login.salesforce.com
WEALTHTWIN_CRM_HUBSPOT_CLIENT_ID=
WEALTHTWIN_CRM_HUBSPOT_CLIENT_SECRET=
WEALTHTWIN_CRM_HUBSPOT_REDIRECT_URI=http://localhost:8000/api/v1/connectors/crm/hubspot/oauth/callback
WEALTHTWIN_CREDENTIAL_ENCRYPTION_KEY=<Fernet key>
```

Generate the encryption key once with:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Keep SMTP, CRM, and encryption credentials in the backend. Register each redirect URI exactly in its provider application. Use `https://test.salesforce.com` for `WEALTHTWIN_CRM_SALESFORCE_LOGIN_URL` when connecting a Salesforce sandbox.

The integration callback exchanges the authorization code, stores encrypted tokens, and enables incremental sync from the Integrations page. Salesforce imports Accounts and Opportunities; HubSpot imports Companies and Deals. Sync is job-driven through Celery. Provider webhooks/change-data capture are not included.

Authentication, sessions, role bindings, and security events still use the current process-backed auth service. Replace those repositories with PostgreSQL-backed implementations before deploying multiple API replicas or treating the system as production-ready.

## Docker Compose

From the workspace root:

```bash
docker compose up --build
```

Services:

- Frontend: `http://127.0.0.1:3000`
- Backend: `http://127.0.0.1:8000`
- OpenAPI: `http://127.0.0.1:8000/api/v1/openapi.json`

The database schema is created by Alembic during backend startup. Only permission reference records are seeded; organizations and users are created through authenticated product flows.
