from typing import Any

from app.transformations.utils import to_datetime, to_decimal


def transform_kline_record(
    row: list[str],
    category: str,
    symbol: str,
    interval: str,
) -> dict[str, Any]:
    if len(row) < 6:
        raise ValueError(f"Invalid kline row length: {len(row)} for symbol={symbol}")

    open_time = to_datetime(row[0])
    open_price = to_decimal(row[1])
    high_price = to_decimal(row[2])
    low_price = to_decimal(row[3])
    close_price = to_decimal(row[4])
    volume = to_decimal(row[5])
    turnover = to_decimal(row[6]) if len(row) > 6 else None

    if open_time is None:
        raise ValueError(f"Missing open_time for symbol={symbol}")

    if (
        open_price is None
        or high_price is None
        or low_price is None
        or close_price is None
    ):
        raise ValueError(f"Missing OHLC values for symbol={symbol}")

    if volume is None:
        raise ValueError(f"Missing volume for symbol={symbol}")

    return {
        "category": category,
        "symbol": symbol,
        "interval": interval,
        "open_time": open_time,
        "open_price": open_price,
        "high_price": high_price,
        "low_price": low_price,
        "close_price": close_price,
        "volume": volume,
        "turnover": turnover,
    }


def transform_kline_list(
    rows: list[list[str]],
    category: str,
    symbol: str,
    interval: str,
) -> list[dict[str, Any]]:
    return [
        transform_kline_record(
            row=row,
            category=category,
            symbol=symbol,
            interval=interval,
        )
        for row in rows
    ]
