from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.connection import engine
from app.models.kline import Kline
from app.schemas.kline import KlineHistoryResponse, KlinePoint


def get_kline_history(
    symbol: str,
    category: str = "linear",
    interval: str = "1",
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    limit: int = 1000,
    ascending: bool = True,
    session: Session | None = None,
) -> KlineHistoryResponse:
    """
    Query historical candlesticks for a symbol, category, and interval,
    formatted for TradingView Lightweight Charts and technical analytics.
    """
    def _execute(db: Session) -> KlineHistoryResponse:
        query = select(Kline).where(
            Kline.category == category,
            Kline.symbol == symbol,
            Kline.interval == interval,
        )

        if start_time:
            query = query.where(Kline.open_time >= start_time)
        if end_time:
            query = query.where(Kline.open_time <= end_time)

        # For charts, chronological order (ascending) is standard
        if ascending:
            query = query.order_by(Kline.open_time.asc())
        else:
            query = query.order_by(Kline.open_time.desc())

        query = query.limit(limit)

        records = db.execute(query).scalars().all()

        points: list[KlinePoint] = [
            KlinePoint(
                time=int(row.open_time.timestamp()),
                timestamp_iso=row.open_time,
                open=float(row.open_price),
                high=float(row.high_price),
                low=float(row.low_price),
                close=float(row.close_price),
                volume=float(row.volume),
                turnover=float(row.turnover) if row.turnover is not None else None,
            )
            for row in records
        ]

        return KlineHistoryResponse(
            category=category,
            symbol=symbol,
            interval=interval,
            count=len(points),
            data=points,
        )

    if session:
        return _execute(session)
    with Session(engine) as database:
        return _execute(database)
