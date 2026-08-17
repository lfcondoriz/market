from datetime import datetime

from fastapi import APIRouter, Query

from app.schemas.funding_rate import (
    FundingRateHistoryResponse,
    MarketSummaryResponse,
)
from app.services import funding_rate_service

router = APIRouter()


@router.get("/summary", response_model=MarketSummaryResponse)
def get_market_summary(
    category: str = Query("linear", description="Bybit category"),
    limit: int = Query(10, ge=1, le=50, description="Top items limit"),
):
    """
    Get current market summary including top positive/negative funding rates and estimated APR.
    """
    return funding_rate_service.get_market_summary(
        category=category,
        top_limit=limit,
    )


@router.get("/{symbol}", response_model=FundingRateHistoryResponse)
def get_symbol_funding_history(
    symbol: str,
    category: str = Query("linear", description="Bybit category"),
    start_time: datetime | None = Query(None, description="Start datetime filter (ISO 8601)"),
    end_time: datetime | None = Query(None, description="End datetime filter (ISO 8601)"),
    limit: int = Query(1000, ge=1, le=10000, description="Maximum number of historical points"),
):
    """
    Get historical funding rates for a specific symbol formatted for TradingView Lightweight Charts.
    """
    return funding_rate_service.get_funding_rate_history(
        category=category,
        symbol=symbol.upper(),
        start_time=start_time,
        end_time=end_time,
        limit=limit,
    )
