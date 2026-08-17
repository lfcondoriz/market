import logging
import time

from pybit.unified_trading import HTTP
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.connection import engine
from app.models.funding_rate import FundingRate
from app.models.instrument import Instrument
from app.repositories.funding_rates_repository import upsert_funding_rates
from app.sources.bybit.client import create_client
from app.sources.bybit.funding_rates_source import (
    MAX_LIMIT_FUNDING_RATE,
    fetch_get_funding_rate_history,
)
from app.transformations.funding_rates_transformer import (
    transform_funding_rate_list,
)

logger = logging.getLogger(__name__)


def get_symbols_for_funding(
    category: str,
    symbol_type: str | None = None,
    symbols: list[str] | None = None,
) -> list[str]:
    if symbols:
        return symbols

    with Session(engine) as database:
        query = select(Instrument.symbol).where(Instrument.category == category)

        if symbol_type is not None:
            query = query.where(Instrument.symbol_type == symbol_type)

        result = database.execute(query).scalars().all()

    return list(result)


def get_symbol_time_bounds(
    category: str,
    symbol: str,
) -> tuple[int | None, int | None]:
    """
    Fetch the oldest and newest funding rate timestamps for a symbol in a single query.
    """
    with Session(engine) as database:
        query = select(
            func.min(FundingRate.funding_rate_timestamp),
            func.max(FundingRate.funding_rate_timestamp),
        ).where(
            FundingRate.category == category,
            FundingRate.symbol == symbol,
        )
        oldest_row, newest_row = database.execute(query).tuples().one()

    oldest = int(oldest_row.timestamp() * 1000) if oldest_row else None
    newest = int(newest_row.timestamp() * 1000) if newest_row else None

    return oldest, newest


def build_ranges_for_symbol(
    category: str,
    symbol: str,
    start_time: int | None = None,
    end_time: int | None = None,
    reset_history: bool = False,
) -> list[tuple[int | None, int | None]]:
    if start_time is not None or end_time is not None:
        return [(start_time, end_time)]

    oldest_ts, newest_ts = get_symbol_time_bounds(category, symbol)
    now_ms = int(time.time() * 1000)

    if reset_history:
        return [(None, now_ms)]

    if oldest_ts is None and newest_ts is None:
        return [(None, now_ms)]

    ranges: list[tuple[int | None, int | None]] = []

    if newest_ts is not None and newest_ts < now_ms:
        ranges.append((newest_ts, now_ms))

    return ranges


def sync_symbol_funding_history(
    client: HTTP,
    category: str,
    symbol: str,
    start_time: int | None = None,
    end_time: int | None = None,
    limit: int = MAX_LIMIT_FUNDING_RATE,
    reset_history: bool = False,
) -> int:
    total_processed = 0

    ranges = build_ranges_for_symbol(
        category=category,
        symbol=symbol,
        start_time=start_time,
        end_time=end_time,
        reset_history=reset_history,
    )

    if not ranges:
        logger.info(
            "No funding rate sync needed for symbol=%s category=%s",
            symbol,
            category,
        )
        return 0

    for current_start_time, current_end_time in ranges:
        raw_funding_rates = fetch_get_funding_rate_history(
            client=client,
            category=category,
            symbol=symbol,
            start_time=current_start_time,
            end_time=current_end_time,
            limit=limit,
        )

        if not raw_funding_rates:
            logger.info(
                "No funding rate data found for symbol=%s category=%s range=(%s,%s)",
                symbol,
                category,
                current_start_time,
                current_end_time,
            )
            continue

        funding_rates = transform_funding_rate_list(raw_funding_rates, category)
        processed = upsert_funding_rates(funding_rates)
        total_processed += processed

        logger.info(
            "Funding rate sync finished: processed=%s category=%s symbol=%s range=(%s,%s)",
            processed,
            category,
            symbol,
            current_start_time,
            current_end_time,
        )

    return total_processed


def ingest_funding_rates(
    category: str = "linear",
    symbols: list[str] | None = None,
    symbol_type: str | None = None,
    start_time: int | None = None,
    end_time: int | None = None,
    limit: int = MAX_LIMIT_FUNDING_RATE,
    reset_history: bool = False,
    client: HTTP | None = None,
) -> None:
    symbols_to_sync = get_symbols_for_funding(
        category=category,
        symbol_type=symbol_type,
        symbols=symbols,
    )

    if not symbols_to_sync:
        logger.warning(
            "No symbols selected for funding-rate ingestion: category=%s symbol_type=%s",
            category,
            symbol_type,
        )
        return

    # Reuse HTTP client instance across all symbol ingestions
    active_client = client or create_client()

    for symbol in symbols_to_sync:
        sync_symbol_funding_history(
            client=active_client,
            category=category,
            symbol=symbol,
            start_time=start_time,
            end_time=end_time,
            limit=limit,
            reset_history=reset_history,
        )


def main() -> None:
    ingest_funding_rates()


if __name__ == "__main__":
    main()
