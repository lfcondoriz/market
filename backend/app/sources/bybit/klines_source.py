import logging
import time

from pybit.unified_trading import HTTP

logger = logging.getLogger(__name__)

BYBIT_KLINE_PAGE_SIZE = 1000


def fetch_get_kline(
    client: HTTP,
    symbol: str,
    category: str = "linear",
    interval: str = "1",
    start_time: int | None = None,
    end_time: int | None = None,
    limit: int | None = None,
) -> list[list[str]]:
    """
    Fetch historical Kline / Candlestick data from Bybit v5 API.

    Each candle is returned as a list of strings:
        [0] startTime: Start time of candle in ms (e.g. '1670608800000')
        [1] openPrice: Open price
        [2] highPrice: Highest price
        [3] lowPrice: Lowest price
        [4] closePrice: Close price
        [5] volume: Trade volume (base coin for linear/USDT, quote coin for inverse)
        [6] turnover: Turnover (quote coin for linear/USDT, base coin for inverse)

    The returned list is sorted in reverse chronological order (newest candle first).
    """
    all_data: list[list[str]] = []

    current_end_time = end_time
    current_start_time = start_time

    if start_time is not None and end_time is None:
        current_end_time = int(time.time() * 1000)

    while True:
        if limit is not None:
            remaining = limit - len(all_data)
            if remaining <= 0:
                break
            request_limit = min(remaining, BYBIT_KLINE_PAGE_SIZE)
        else:
            request_limit = BYBIT_KLINE_PAGE_SIZE

        response = client.get_kline(
            category=category,
            symbol=symbol,
            interval=interval,
            start=current_start_time,
            end=current_end_time,
            limit=request_limit,
        )

        ret_code = response.get("retCode")
        if ret_code != 0:
            logger.error(
                "Bybit API error fetching klines for symbol=%s category=%s "
                "interval=%s: retCode=%s retMsg=%s",
                symbol,
                category,
                interval,
                ret_code,
                response.get("retMsg"),
            )
            break

        result = response.get("result") or {}
        rows = result.get("list") or []

        if not rows:
            break

        all_data.extend(rows)

        if len(rows) < request_limit:
            break

        oldest_timestamp = int(rows[-1][0])
        next_end_time = oldest_timestamp - 1

        if current_end_time == next_end_time:
            break

        if (
            current_start_time is not None
            and next_end_time < current_start_time
        ):
            break

        current_end_time = next_end_time

    return all_data
