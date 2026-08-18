import logging
import time

from pybit.unified_trading import HTTP
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.connection import engine
from app.models.instrument import Instrument
from app.repositories.klines_repository import (
    get_kline_time_bounds,
    upsert_klines,
)
from app.sources.bybit.client import create_client
from app.sources.bybit.klines_source import fetch_get_kline
from app.transformations.klines_transformer import transform_kline_list

logger = logging.getLogger(__name__)


def get_symbols_for_klines(
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


def build_ranges_for_symbol(
    category: str,
    symbol: str,
    interval: str,
    start_time: int | None = None,
    end_time: int | None = None,
    reset_history: bool = False,
) -> list[tuple[int | None, int | None]]:
    if start_time is not None or end_time is not None:
        return [(start_time, end_time)]

    now_ms = int(time.time() * 1000)

    if reset_history:
        return [(None, now_ms)]

    oldest_ts, newest_ts = get_kline_time_bounds(
        category=category,
        symbol=symbol,
        interval=interval,
    )

    if oldest_ts is None and newest_ts is None:
        return [(None, now_ms)]

    ranges: list[tuple[int | None, int | None]] = []

    # Incremental update: fetch from newest_ts to now_ms
    if newest_ts is not None and newest_ts < now_ms:
        ranges.append((newest_ts, now_ms))

    return ranges


def sync_symbol_kline_history(
    client: HTTP,
    category: str,
    symbol: str,
    interval: str = "1",
    start_time: int | None = None,
    end_time: int | None = None,
    limit: int | None = None,
    reset_history: bool = False,
) -> int:
    total_processed = 0

    ranges = build_ranges_for_symbol(
        category=category,
        symbol=symbol,
        interval=interval,
        start_time=start_time,
        end_time=end_time,
        reset_history=reset_history,
    )

    if not ranges:
        logger.info(
            "No kline sync needed for symbol=%s category=%s interval=%s",
            symbol,
            category,
            interval,
        )
        return 0

    for current_start_time, current_end_time in ranges:
        raw_klines = fetch_get_kline(
            client=client,
            symbol=symbol,
            category=category,
            interval=interval,
            start_time=current_start_time,
            end_time=current_end_time,
            limit=limit,
        )

        if not raw_klines:
            logger.info(
                "No kline data found for symbol=%s category=%s interval=%s range=(%s,%s)",
                symbol,
                category,
                interval,
                current_start_time,
                current_end_time,
            )
            continue

        klines_data = transform_kline_list(
            rows=raw_klines,
            category=category,
            symbol=symbol,
            interval=interval,
        )
        processed = upsert_klines(klines_data)
        total_processed += processed

        logger.info(
            "Kline sync finished: processed=%s category=%s symbol=%s interval=%s range=(%s,%s)",
            processed,
            category,
            symbol,
            interval,
            current_start_time,
            current_end_time,
        )

    return total_processed


def ingest_klines(
    category: str = "linear",
    symbols: list[str] | None = None,
    symbol_type: str | None = None,
    interval: str = "1",
    start_time: int | None = None,
    end_time: int | None = None,
    limit: int | None = None,
    reset_history: bool = False,
    client: HTTP | None = None,
) -> None:
    symbols_to_sync = get_symbols_for_klines(
        category=category,
        symbol_type=symbol_type,
        symbols=symbols,
    )

    if not symbols_to_sync:
        logger.warning(
            "No symbols selected for kline ingestion: category=%s symbol_type=%s",
            category,
            symbol_type,
        )
        return

    active_client = client or create_client()

    for symbol in symbols_to_sync:
        sync_symbol_kline_history(
            client=active_client,
            category=category,
            symbol=symbol,
            interval=interval,
            start_time=start_time,
            end_time=end_time,
            limit=limit,
            reset_history=reset_history,
        )


def main() -> None:
    ingest_klines()


if __name__ == "__main__":
    main()
