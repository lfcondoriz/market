import logging
from typing import Any

from pybit.unified_trading import HTTP

logger = logging.getLogger(__name__)


def fetch_instruments_from_bybit(
    client: HTTP,
    category: str = "linear",
    limit: int = 1000,
) -> list[dict[str, Any]]:
    cursor: str | None = None
    instruments: list[dict[str, Any]] = []

    while True:
        parameters: dict[str, Any] = {
            "category": category,
            "limit": limit,
        }

        if cursor:
            parameters["cursor"] = cursor

        response = client.get_instruments_info(**parameters)

        ret_code = response.get("retCode")
        if ret_code != 0:
            logger.error(
                "Bybit API error fetching instruments for category=%s: retCode=%s retMsg=%s",
                category,
                ret_code,
                response.get("retMsg"),
            )
            raise RuntimeError(
                f"Bybit API error fetching instruments ({category}): {response.get('retMsg')}"
            )

        result = response.get("result") or {}
        rows = result.get("list") or []

        instruments.extend(rows)

        cursor = result.get("nextPageCursor")

        if not cursor:
            break

    return instruments
