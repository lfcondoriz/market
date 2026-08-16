from datetime import datetime, timezone
from decimal import Decimal
from typing import Any


def to_datetime(value: str | None) -> datetime | None:
    if not value or value == "0":
        return None

    return datetime.fromtimestamp(
        int(value) / 1000,
        tz=timezone.utc,
    )


def to_decimal(value: str | None) -> Decimal | None:
    if value in (None, ""):
        return None

    return Decimal(value)


def transform_instrument_record(
    data: dict[str, Any],
    category: str,
) -> dict[str, Any]:
    leverage = data.get("leverageFilter") or {}
    price = data.get("priceFilter") or {}
    lot = data.get("lotSizeFilter") or {}

    return {
        "category": category,
        "symbol": data["symbol"],
        "contract_type": data["contractType"],
        "status": data["status"],
        "base_coin": data["baseCoin"],
        "quote_coin": data["quoteCoin"],
        "settle_coin": data.get("settleCoin"),
        "launch_time": to_datetime(data.get("launchTime")),
        "delivery_time": to_datetime(data.get("deliveryTime")),
        "price_scale": (
            int(data["priceScale"])
            if data.get("priceScale")
            else None
        ),
        # ...
    }


def transform_instrument_list(
    records: list[dict[str, Any]],
    category: str,
) -> list[dict[str, Any]]:
    return [
        transform_instrument_record(record, category)
        for record in records
    ]
