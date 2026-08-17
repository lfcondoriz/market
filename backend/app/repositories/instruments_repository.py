from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.connection import engine
from app.models.instrument import Instrument
from app.repositories.base_repository import generic_upsert


def upsert_instruments(
    values: list[dict[str, Any]],
    session: Session | None = None,
) -> int:
    return generic_upsert(
        model_class=Instrument,
        index_elements=["category", "symbol"],
        values=values,
        session=session,
    )


def count_instruments(
    category: str,
    session: Session | None = None,
) -> int:
    def _execute(db: Session) -> int:
        query = select(func.count()).select_from(Instrument).where(Instrument.category == category)
        return db.execute(query).scalar() or 0

    if session is not None:
        return _execute(session)

    with Session(engine) as database:
        return _execute(database)
