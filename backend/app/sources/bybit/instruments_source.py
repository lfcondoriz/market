from typing import Any

from pybit.unified_trading import HTTP


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

        if response["retCode"] != 0:
            raise RuntimeError(response["retMsg"])

        result = response["result"]

        instruments.extend(result["list"])

        cursor = result.get("nextPageCursor")

        if not cursor:
            break

    return instruments
