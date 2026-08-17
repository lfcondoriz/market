import logging
import time
from typing import Any

from pybit.unified_trading import HTTP

logger = logging.getLogger(__name__)

MAX_LIMIT_FUNDING_RATE = 200


def fetch_get_funding_rate_history(
    client: HTTP,
    category: str = "linear",
    symbol: str | None = None,
    start_time: int | None = None,
    end_time: int | None = None,
    limit: int = MAX_LIMIT_FUNDING_RATE,
) -> list[dict[str, Any]]:
    all_data: list[dict[str, Any]] = []

    current_end_time = end_time
    current_start_time = start_time

    if start_time is not None and end_time is None:
        current_end_time = int(time.time() * 1000)

    while len(all_data) < limit:
        request_limit = min(limit - len(all_data), MAX_LIMIT_FUNDING_RATE)
        if request_limit <= 0:
            break

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

        current_end_time = next_end_time

    return all_data
