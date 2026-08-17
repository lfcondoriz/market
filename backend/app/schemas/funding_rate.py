from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class FundingRatePoint(BaseModel):
    time: int  # Unix timestamp in seconds (TradingView Lightweight Charts format)
    timestamp_iso: datetime
    value: float  # Funding rate value as float for chart rendering
    funding_rate_percentage: float  # Percentage format (value * 100)

    model_config = ConfigDict(from_attributes=True)


class FundingRateHistoryResponse(BaseModel):
    category: str
    symbol: str
    count: int
    data: list[FundingRatePoint]


class FundingRateSummaryItem(BaseModel):
    symbol: str
    category: str
    latest_funding_rate: float
    latest_funding_rate_pct: float
    annualized_apr_pct: float  # Estimated APR % (funding_rate * 3 * 365 * 100)
    last_updated: datetime


class MarketSummaryResponse(BaseModel):
    total_symbols: int
    top_positive: list[FundingRateSummaryItem]
    top_negative: list[FundingRateSummaryItem]
