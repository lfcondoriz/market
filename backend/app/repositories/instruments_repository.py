from typing import Any

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.db.connection import engine
from app.models.instrument import Instrument


def upsert_instruments(values: list[dict[str, Any]]) -> int:
    if not values:
        return 0

    statement = insert(Instrument).values(values)

    excluded = statement.excluded

    statement = statement.on_conflict_do_update(
        index_elements=["category", "symbol"],
        set_={
            column.name: getattr(excluded, column.name)
            for column in Instrument.__table__.columns
            if column.name not in {"category", "symbol"}
        },
    ).returning(Instrument.symbol)

    with Session(engine) as database:
        result = database.execute(statement)
        processed = len(result.all())
        database.commit()

    return processed


def count_instruments(category: str) -> int:
    with Session(engine) as database:
        query = select(func.count()).select_from(Instrument).where(Instrument.category == category)
        return database.execute(query).scalar() or 0


