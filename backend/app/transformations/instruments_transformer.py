from typing import Any

from app.transformations.utils import to_datetime, to_decimal


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
        "launch_time": to_datetime(data.get("launchTime")),
        "delivery_time": to_datetime(data.get("deliveryTime")),
        "delivery_fee_rate": to_decimal(data.get("deliveryFeeRate")),
        "price_scale": (
            int(data["priceScale"])
            if data.get("priceScale")
            else None
        ),
        "min_leverage": to_decimal(leverage.get("minLeverage")),
        "max_leverage": to_decimal(leverage.get("maxLeverage")),
        "leverage_step": to_decimal(leverage.get("leverageStep")),
        "min_price": to_decimal(price.get("minPrice")),
        "max_price": to_decimal(price.get("maxPrice")),
        "tick_size": to_decimal(price.get("tickSize")),
        "max_order_qty": to_decimal(lot.get("maxOrderQty")),
        "min_order_qty": to_decimal(lot.get("minOrderQty")),
        "qty_step": to_decimal(lot.get("qtyStep")),
        "post_only_max_order_qty": to_decimal(
            lot.get("postOnlyMaxOrderQty")
        ),
        "max_mkt_order_qty": to_decimal(lot.get("maxMktOrderQty")),
        "min_notional_value": to_decimal(lot.get("minNotionalValue")),
        "unified_margin_trade": data.get("unifiedMarginTrade"),
        "funding_interval": data.get("fundingInterval"),
        "settle_coin": data.get("settleCoin"),
        "copy_trading": data.get("copyTrading"),
        "upper_funding_rate": to_decimal(data.get("upperFundingRate")),
        "lower_funding_rate": to_decimal(data.get("lowerFundingRate")),
        "is_pre_listing": bool(data.get("isPreListing") is True),
        "pre_listing_info": data.get("preListingInfo"),
        "risk_parameters": data.get("riskParameters"),
        "display_name": data.get("displayName"),
        "symbol_type": data.get("symbolType"),
        "forbid_upl_withdrawal": data.get("forbidUplWithdrawal"),
        "symbol_id": data.get("symbolId"),
        "raw_payload": data,
    }


def transform_instrument_list(
    records: list[dict[str, Any]],
    category: str,
) -> list[dict[str, Any]]:
    return [
        transform_instrument_record(record, category)
        for record in records
    ]
