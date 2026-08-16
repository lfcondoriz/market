from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from pybit.unified_trading import HTTP
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.db.connection import engine
from app.db.create_tables import create_tables
from app.models.instrument import Instrument


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


def transform_instrument(
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
        "price_scale": int(data["priceScale"]) if data.get("priceScale") else None,
        "funding_interval": data.get("fundingInterval"),
        "min_price": to_decimal(price.get("minPrice")),
        "max_price": to_decimal(price.get("maxPrice")),
        "tick_size": to_decimal(price.get("tickSize")),
        "min_leverage": to_decimal(leverage.get("minLeverage")),
        "max_leverage": to_decimal(leverage.get("maxLeverage")),
        "leverage_step": to_decimal(leverage.get("leverageStep")),
        "min_order_qty": to_decimal(lot.get("minOrderQty")),
        "max_order_qty": to_decimal(lot.get("maxOrderQty")),
        "qty_step": to_decimal(lot.get("qtyStep")),
        "post_only_max_order_qty": to_decimal(lot.get("postOnlyMaxOrderQty")),
        "max_mkt_order_qty": to_decimal(lot.get("maxMktOrderQty")),
        "min_notional_value": to_decimal(lot.get("minNotionalValue")),
        "delivery_fee_rate": to_decimal(data.get("deliveryFeeRate")),
        "upper_funding_rate": to_decimal(data.get("upperFundingRate")),
        "lower_funding_rate": to_decimal(data.get("lowerFundingRate")),
        "unified_margin_trade": data.get("unifiedMarginTrade"),
        "copy_trading": data.get("copyTrading"),
        "is_pre_listing": data.get("isPreListing", False),
        "pre_listing_info": data.get("preListingInfo"),
        "risk_parameters": data.get("riskParameters"),
        "display_name": data.get("displayName"),
        "symbol_type": data.get("symbolType"),
        "forbid_upl_withdrawal": data.get("forbidUplWithdrawal"),
        "symbol_id": data.get("symbolId"),
        "leverage_filter": leverage,
        "price_filter": price,
        "lot_size_filter": lot,
    }


def save_instruments(values: list[dict[str, Any]]) -> int:
    if not values:
        return 0

    statement = insert(Instrument).values(values)

    excluded = statement.excluded

    statement = statement.on_conflict_do_update(
        index_elements=["category", "symbol"],
        set_={
            column.name: getattr(excluded, column.name)
            for column in Instrument.__table__.columns
            if column.name not in {"category", "symbol"}
        },
    ).returning(Instrument.symbol)

    with Session(engine) as database:
        result = database.execute(statement)
        processed = len(result.all())
        database.commit()

    return processed


def ingest_instruments(
    category: str = "linear",
    limit: int = 1000,
) -> None:
    bybit = HTTP(testnet=False)

    cursor: str | None = None
    page = 1
    total = 0

    while True:
        parameters: dict[str, Any] = {
            "category": category,
            "limit": limit,
        }

        if cursor:
            parameters["cursor"] = cursor

        response = bybit.get_instruments_info(**parameters)

        if response["retCode"] != 0:
            raise RuntimeError(response["retMsg"])

        result = response["result"]
        raw_instruments = result["list"]

        values = [
            transform_instrument(item, category)
            for item in raw_instruments
        ]

        processed = save_instruments(values)
        total += processed

        print(
            f"Página {page}: recibidos={len(values)}, "
            f"procesados={processed}"
        )

        cursor = result.get("nextPageCursor")

        if not cursor:
            break

        page += 1

    print(f"Total procesados: {total}")


def main() -> None:
    create_tables()
    ingest_instruments(category="linear")


if __name__ == "__main__":
    main()