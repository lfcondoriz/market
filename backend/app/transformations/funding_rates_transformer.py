from typing import Any

from app.transformations.utils import to_datetime, to_decimal


def transform_funding_rate_record(
    data: dict[str, Any],
    category: str,
) -> dict[str, Any]:
    symbol = data.get("symbol")
    funding_rate = to_decimal(data.get("fundingRate"))
    funding_rate_timestamp = to_datetime(data.get("fundingRateTimestamp"))

    if symbol is None:
        raise ValueError("Missing symbol in funding rate payload")

    if funding_rate is None:
        raise ValueError(f"Missing fundingRate for symbol={symbol}")

    if funding_rate_timestamp is None:
        raise ValueError(f"Missing fundingRateTimestamp for symbol={symbol}")

    return {
        "category": category,
        "symbol": symbol,
        "funding_rate": funding_rate,
        "funding_rate_timestamp": funding_rate_timestamp,
        "settlement_timestamp": to_datetime(data.get("settlementTimestamp")),
        "raw_payload": data,
    }


def transform_funding_rate_list(
    records: list[dict[str, Any]],
    category: str,
) -> list[dict[str, Any]]:
    return [
        transform_funding_rate_record(record, category)
        for record in records
    ]
