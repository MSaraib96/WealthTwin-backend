# WealthTwin

WealthTwin is split into two deployable repositories inside this workspace:

- `wealthtwin-frontend`: Next.js executive app and auth UI
- `wealthtwin-backend`: FastAPI backend, auth/authorization foundation, AI gateway, connector APIs, migrations, and worker entrypoints

## Local Production Stack

```bash
docker compose up --build
```

Services:

- Frontend: `http://127.0.0.1:3000`
- Backend: `http://127.0.0.1:8000`
- Backend readiness: `http://127.0.0.1:8000/ready`
- Backend OpenAPI: `http://127.0.0.1:8000/api/v1/openapi.json`

## First Account

Open `http://127.0.0.1:3000/register` and create the first organization. That verified account becomes the Organization Admin. WealthTwin does not seed sample users or sample financial records.

Configure SMTP before registration so verification and invitation links are delivered by email. Without SMTP, local development messages are retained only in the backend process outbox.

## Production Secrets

Copy and edit:

```bash
cp wealthtwin-backend/.env.example wealthtwin-backend/.env
cp wealthtwin-frontend/.env.example wealthtwin-frontend/.env
```

LLM, SMTP, CRM OAuth, database, Redis, and session secrets belong in the backend environment. Do not put provider secrets in the frontend.
