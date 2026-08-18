from datetime import datetime

from fastapi import APIRouter, Query

from app.schemas.kline import KlineHistoryResponse
from app.services import kline_service

router = APIRouter()


@router.get("/{symbol}", response_model=KlineHistoryResponse)
def get_symbol_klines(
    symbol: str,
    category: str = Query("linear", description="Bybit category (e.g. linear, spot)"),
    interval: str = Query(
        "1",
        description="Kline interval (e.g. 1, 3, 5, 15, 30, 60, 120, 240, 360, 720, D, W, M)",
    ),
    start_time: datetime | None = Query(
        None,
        description="Start datetime filter (ISO 8601, e.g. 2026-01-01T00:00:00Z)",
    ),
    end_time: datetime | None = Query(
        None,
        description="End datetime filter (ISO 8601, e.g. 2026-08-18T00:00:00Z)",
    ),
    limit: int = Query(
        1000,
        ge=1,
        le=10000,
        description="Maximum number of candles to return",
    ),
    ascending: bool = Query(
        True,
        description="Order candles chronologically (oldest to newest)",
    ),
):
    """
    Get historical Kline / Candlestick data for a specific symbol, category, and interval,
    formatted for TradingView Lightweight Charts.
    """
    return kline_service.get_kline_history(
        symbol=symbol.upper(),
        category=category,
        interval=interval,
        start_time=start_time,
        end_time=end_time,
        limit=limit,
        ascending=ascending,
    )
