from __future__ import annotations

from app.db.seed import seed_initial_data
from app.db.session import SessionLocal


def main() -> None:
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
