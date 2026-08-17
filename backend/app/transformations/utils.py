from datetime import datetime, timezone
from decimal import Decimal


def to_datetime(value: str | int | None) -> datetime | None:
    if not value or value == "0":
        return None

    return datetime.fromtimestamp(
        int(value) / 1000,
        tz=timezone.utc,
    )


def to_decimal(value: str | int | float | None) -> Decimal | None:
    if value in (None, ""):
        return None

    return Decimal(str(value))
