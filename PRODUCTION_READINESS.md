# WealthTwin Production Readiness

This repository now contains a deployable production foundation, but external services must be configured before it can operate as a live SaaS product.

## Included

- Next.js production frontend with landing -> login -> app flow
- FastAPI backend with versioned `/api/v1` APIs
- Backend-owned auth, session, TOTP MFA, RBAC, member invitation, and tenant context foundation
- PostgreSQL SQLAlchemy schema
- Alembic baseline migration
- Redis/Celery worker entrypoint for connector sync jobs
- AI Gateway abstraction with Qwen/OpenAI-compatible call path
- SMTP delivery for verification, recovery, and invitations, with a local process outbox when SMTP is absent
- Salesforce and HubSpot authorization-code callbacks with expiring, single-use state and Salesforce PKCE
- Fernet-encrypted OAuth token persistence and refresh-token handling
- Tenant-scoped incremental CRM synchronization with idempotent customer and sales-order upserts
- Persisted connector status, cursors, sync runs, retryable background jobs, and disconnect controls
- Dockerfiles for frontend and backend
- Docker Compose for frontend, backend, worker, Postgres, and Redis
- CI workflow for frontend and backend checks

## Required Before Real Production Use

- Replace in-memory auth service with repositories backed by PostgreSQL models.
- Implement secure refresh-token rotation and store only hashed refresh/session credentials.
- Configure production SMTP credentials and delivery monitoring.
- Configure Salesforce/HubSpot OAuth applications, redirect URIs, scopes, and a stable credential encryption key.
- Move the credential encryption key to the deployment secrets manager and establish key rotation procedures.
- Add provider webhooks or change-data capture, reconciliation schedules, and a dead-letter queue if sub-minute updates are required. The implemented sync is live, incremental, and job-driven, not webhook real-time.
- Implement canonical file/connector ingestion, mapping approval, metric engine, forecasts, and scenario calculations against persisted tenant data.
- Configure `WEALTHTWIN_LLM_API_KEY`, `WEALTHTWIN_LLM_BASE_URL`, and provider routing for live AI.
- Add audit-log persistence for security and financial configuration events.
- Add production observability, rate limiting, CSRF protection for cookie state changes, and deployment secrets.

## Local Production Stack

```bash
cp wealthtwin-backend/.env.example wealthtwin-backend/.env
docker compose up --build
```

Set unique session and credential-encryption keys in `.env` before startup. CRM credentials are optional until a provider is connected.

Frontend: `http://127.0.0.1:3000`

Backend: `http://127.0.0.1:8000`

Backend readiness: `http://127.0.0.1:8000/ready`
