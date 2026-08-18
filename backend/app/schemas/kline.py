from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class KlinePoint(BaseModel):
    time: int  # Unix timestamp in seconds (TradingView Lightweight Charts format)
    timestamp_iso: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float
    turnover: float | None = None

    model_config = ConfigDict(from_attributes=True)


class KlineRecord(BaseModel):
    category: str
    symbol: str
    interval: str
    open_time: datetime
    open_price: Decimal
    high_price: Decimal
    low_price: Decimal
    close_price: Decimal
    volume: Decimal
    turnover: Decimal | None = None

    model_config = ConfigDict(from_attributes=True)


class KlineHistoryResponse(BaseModel):
    category: str
    symbol: str
    interval: str
    count: int
    data: list[KlinePoint]
