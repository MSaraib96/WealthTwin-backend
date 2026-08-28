from __future__ import annotations

import asyncio

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.domain.connectors import connector_service
from app.worker import celery_app


@celery_app.task(name="connectors.sync", autoretry_for=(), acks_late=True)
def sync_connector(run_id: str) -> dict[str, object]:
    settings = get_settings()
    with SessionLocal() as db:
        run = asyncio.run(connector_service.execute_sync(db, run_id, settings))
        return {
            "runId": run.id,
            "connectorId": run.connector_id,
            "status": run.status.value,
            "recordsProcessed": run.records_processed,
            "message": run.message,
        }
