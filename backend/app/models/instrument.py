from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Instrument(Base):
    __tablename__ = "instruments"

    category: Mapped[str] = mapped_column(
        String(20),
        primary_key=True,
    )

    symbol: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
    )

    contract_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    base_coin: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    quote_coin: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    settle_coin: Mapped[str | None] = mapped_column(String(30))

    launch_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    delivery_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    price_scale: Mapped[int | None] = mapped_column(Integer)
    funding_interval: Mapped[int | None] = mapped_column(Integer)

    # Valores numéricos del payload de Bybit
    min_price: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    max_price: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    tick_size: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))

    min_leverage: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    max_leverage: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    leverage_step: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))

    min_order_qty: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    max_order_qty: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    qty_step: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    post_only_max_order_qty: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    max_mkt_order_qty: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    min_notional_value: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    delivery_fee_rate: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))

    upper_funding_rate: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    lower_funding_rate: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))

    unified_margin_trade: Mapped[bool | None] = mapped_column(Boolean)
    copy_trading: Mapped[str | None] = mapped_column(String(30))

    is_pre_listing: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    display_name: Mapped[str | None] = mapped_column(String(100))
    symbol_type: Mapped[str | None] = mapped_column(String(50))
    forbid_upl_withdrawal: Mapped[bool | None] = mapped_column(Boolean)
    symbol_id: Mapped[int | None] = mapped_column(Integer)

    # Objetos originales de Bybit
    leverage_filter: Mapped[dict | None] = mapped_column(JSONB)
    price_filter: Mapped[dict | None] = mapped_column(JSONB)
    lot_size_filter: Mapped[dict | None] = mapped_column(JSONB)
    risk_parameters: Mapped[dict | None] = mapped_column(JSONB)
    pre_listing_info: Mapped[dict | None] = mapped_column(JSONB)
