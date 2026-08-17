from typing import Any

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.db.connection import engine
from app.models.funding_rate import FundingRate


def upsert_funding_rates(values: list[dict[str, Any]]) -> int:
    if not values:
        return 0

    statement = insert(FundingRate).values(values)
    excluded = statement.excluded

    statement = statement.on_conflict_do_update(
        index_elements=["category", "symbol", "funding_rate_timestamp"],
        set_={
            column.name: getattr(excluded, column.name)
            for column in FundingRate.__table__.columns
            if column.name not in {"category", "symbol", "funding_rate_timestamp"}
        },
    ).returning(FundingRate.symbol)

    with Session(engine) as database:
        result = database.execute(statement)
        processed = len(result.all())
        database.commit()

    return processed
