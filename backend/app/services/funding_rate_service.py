from datetime import datetime
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.connection import engine
from app.models.funding_rate import FundingRate
from app.schemas.funding_rate import (
    FundingRateHistoryResponse,
    FundingRatePoint,
    FundingRateSummaryItem,
    MarketSummaryResponse,
)


def get_funding_rate_history(
    category: str,
    symbol: str,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    limit: int = 1000,
    session: Session | None = None,
) -> FundingRateHistoryResponse:
    def _execute(db: Session) -> FundingRateHistoryResponse:
        query = select(FundingRate).where(
            FundingRate.category == category,
            FundingRate.symbol == symbol,
        )

        if start_time:
            query = query.where(FundingRate.funding_rate_timestamp >= start_time)
        if end_time:
            query = query.where(FundingRate.funding_rate_timestamp <= end_time)

        query = query.order_by(FundingRate.funding_rate_timestamp.asc()).limit(limit)

        records = db.execute(query).scalars().all()

        points: list[FundingRatePoint] = []
        for row in records:
            val = float(row.funding_rate)
            points.append(
                FundingRatePoint(
                    time=int(row.funding_rate_timestamp.timestamp()),
                    timestamp_iso=row.funding_rate_timestamp,
                    value=val,
                    funding_rate_percentage=round(val * 100, 6),
                )
            )

        return FundingRateHistoryResponse(
            category=category,
            symbol=symbol,
            count=len(points),
            data=points,
        )

    if session:
        return _execute(session)
    with Session(engine) as database:
        return _execute(database)


def get_market_summary(
    category: str = "linear",
    top_limit: int = 10,
    session: Session | None = None,
) -> MarketSummaryResponse:
    def _execute(db: Session) -> MarketSummaryResponse:
        # Subquery for latest funding rate per symbol
        subquery = (
            select(
                FundingRate.symbol,
                FundingRate.category,
                FundingRate.funding_rate,
                FundingRate.funding_rate_timestamp,
                func.row_number()
                .over(
                    partition_by=[FundingRate.category, FundingRate.symbol],
                    order_by=FundingRate.funding_rate_timestamp.desc(),
                )
                .label("rn"),
            )
            .where(FundingRate.category == category)
            .subquery()
        )

        latest_query = select(subquery).where(subquery.c.rn == 1)
        rows = db.execute(latest_query).all()

        summary_items: list[FundingRateSummaryItem] = []
        for r in rows:
            val = float(r.funding_rate)
            val_pct = val * 100
            # 8-hour funding intervals = 3 times a day * 365 days
            annualized_apr = val_pct * 3 * 365

            summary_items.append(
                FundingRateSummaryItem(
                    symbol=r.symbol,
                    category=r.category,
                    latest_funding_rate=val,
                    latest_funding_rate_pct=round(val_pct, 6),
                    annualized_apr_pct=round(annualized_apr, 2),
                    last_updated=r.funding_rate_timestamp,
                )
            )

        # Sort for top positive and top negative
        sorted_by_rate = sorted(summary_items, key=lambda x: x.latest_funding_rate, reverse=True)
        top_positive = sorted_by_rate[:top_limit]
        top_negative = sorted_by_rate[::-1][:top_limit]

        return MarketSummaryResponse(
            total_symbols=len(summary_items),
            top_positive=top_positive,
            top_negative=top_negative,
        )

    if session:
        return _execute(session)
    with Session(engine) as database:
        return _execute(database)
