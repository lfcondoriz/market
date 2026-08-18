from datetime import datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.connection import engine
from app.models.kline import Kline
from app.repositories.base_repository import generic_upsert


def upsert_klines(
    values: list[dict[str, Any]],
    session: Session | None = None,
) -> int:
    return generic_upsert(
        model_class=Kline,
        index_elements=["category", "symbol", "interval", "open_time"],
        values=values,
        session=session,
    )


def get_kline_time_bounds(
    category: str,
    symbol: str,
    interval: str,
    session: Session | None = None,
) -> tuple[int | None, int | None]:
    """
    Fetch the oldest and newest open_time timestamps in milliseconds for a symbol and interval.
    """
    query = select(
        func.min(Kline.open_time),
        func.max(Kline.open_time),
    ).where(
        Kline.category == category,
        Kline.symbol == symbol,
        Kline.interval == interval,
    )

    def _execute(db: Session) -> tuple[int | None, int | None]:
        oldest_dt, newest_dt = db.execute(query).tuples().one()
        oldest = int(oldest_dt.timestamp() * 1000) if oldest_dt else None
        newest = int(newest_dt.timestamp() * 1000) if newest_dt else None
        return oldest, newest

    if session is not None:
        return _execute(session)

    with Session(engine) as database:
        return _execute(database)


def get_klines_by_range(
    category: str,
    symbol: str,
    interval: str,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    limit: int | None = None,
    ascending: bool = True,
    session: Session | None = None,
) -> list[Kline]:
    """
    Fetch candles for a symbol and interval within an optional datetime range.
    """
    query = select(Kline).where(
        Kline.category == category,
        Kline.symbol == symbol,
        Kline.interval == interval,
    )

    if start_time is not None:
        query = query.where(Kline.open_time >= start_time)

    if end_time is not None:
        query = query.where(Kline.open_time <= end_time)

    if ascending:
        query = query.order_by(Kline.open_time.asc())
    else:
        query = query.order_by(Kline.open_time.desc())

    if limit is not None:
        query = query.limit(limit)

    def _execute(db: Session) -> list[Kline]:
        return list(db.execute(query).scalars().all())

    if session is not None:
        return _execute(session)

    with Session(engine) as database:
        return _execute(database)
