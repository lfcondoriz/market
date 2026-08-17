import logging
import time
from typing import Any

from pybit.unified_trading import HTTP

logger = logging.getLogger(__name__)

BYBIT_PAGE_SIZE = 200


def fetch_get_funding_rate_history(
    client: HTTP,
    category: str = "linear",
    symbol: str | None = None,
    start_time: int | None = None,
    end_time: int | None = None,
    limit: int | None = None,
) -> list[dict[str, Any]]:
    all_data: list[dict[str, Any]] = []

    current_end_time = end_time
    current_start_time = start_time

    if start_time is not None and end_time is None:
        current_end_time = int(time.time() * 1000)

    while True:
        if limit is not None:
            remaining = limit - len(all_data)
            if remaining <= 0:
                break
            request_limit = min(remaining, BYBIT_PAGE_SIZE)
        else:
            request_limit = BYBIT_PAGE_SIZE

        response = client.get_funding_rate_history(
            category=category,
            symbol=symbol,
            endTime=current_end_time,
            startTime=current_start_time,
            limit=request_limit,
        )

        ret_code = response.get("retCode")
        if ret_code != 0:
            logger.error(
                "Bybit API error fetching funding rate history for symbol=%s category=%s: retCode=%s retMsg=%s",
                symbol,
                category,
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

        oldest_timestamp = int(rows[-1]["fundingRateTimestamp"])
        next_end_time = oldest_timestamp - 1

        if current_end_time == next_end_time:
            break

        if current_start_time is not None and next_end_time <= current_start_time:
            break

        current_end_time = next_end_time

    return all_data
