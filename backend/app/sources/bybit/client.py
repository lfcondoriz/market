from typing import Any

from pybit.unified_trading import HTTP

from app.sources.bybit.funding_rates_source import fetch_get_funding_rate_history
from app.sources.bybit.instruments_source import fetch_instruments_from_bybit
from app.sources.bybit.klines_source import fetch_get_kline


class BybitMarketClient:
    """
    Unified market data client wrapper around pybit HTTP client.
    Encapsulates exchange-specific API logic for Bybit.
    """

    def __init__(self, testnet: bool = False) -> None:
        self.http_client = HTTP(testnet=testnet)

    def fetch_instruments(
        self,
        category: str = "linear",
        limit: int = 1000,
    ) -> list[dict[str, Any]]:
        return fetch_instruments_from_bybit(
            client=self.http_client,
            category=category,
            limit=limit,
        )

    def fetch_funding_history(
        self,
        category: str = "linear",
        symbol: str | None = None,
        start_time: int | None = None,
        end_time: int | None = None,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        return fetch_get_funding_rate_history(
            client=self.http_client,
            category=category,
            symbol=symbol,
            start_time=start_time,
            end_time=end_time,
            limit=limit,
        )

    def fetch_klines(
        self,
        symbol: str,
        category: str = "linear",
        interval: str = "1",
        start_time: int | None = None,
        end_time: int | None = None,
        limit: int | None = None,
    ) -> list[list[str]]:
        return fetch_get_kline(
            client=self.http_client,
            symbol=symbol,
            category=category,
            interval=interval,
            start_time=start_time,
            end_time=end_time,
            limit=limit,
        )


def create_client() -> HTTP:
    return HTTP(testnet=False)
