from __future__ import annotations

from sqlalchemy.orm import Session

from app.auth.permissions import ROLE_PERMISSIONS
from app.db.models import PermissionRecord


def seed_initial_data(db: Session) -> None:
    permission_records = {
        permission.value: db.get(PermissionRecord, permission.value)
        for permissions in ROLE_PERMISSIONS.values()
        for permission in permissions
    }
    for permission_id, record in permission_records.items():
        if not record:
            db.add(PermissionRecord(id=permission_id, category=permission_id.split(".", 1)[0]))

    db.commit()
