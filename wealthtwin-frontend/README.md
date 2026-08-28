# WealthTwin Frontend

Responsive Next.js frontend for the WealthTwin executive financial command center.

## Run Locally

```bash
npm install
npm run dev
```

The UI loads identity, permissions, organization state, and financial workspaces from `/api/v1/...`. Missing source data is rendered as an explicit setup state; the frontend does not contain sample financial records or authoritative calculations.
