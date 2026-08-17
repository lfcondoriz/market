from datetime import datetime
from decimal import Decimal
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class InstrumentResponse(BaseModel):
    category: str
    symbol: str
    contract_type: str
    status: str
    base_coin: str
    quote_coin: str
    launch_time: datetime | None = None
    min_leverage: Decimal | None = None
    max_leverage: Decimal | None = None
    funding_interval: int | None = None
    symbol_type: str | None = None
    display_name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    limit: int
    total_pages: int
