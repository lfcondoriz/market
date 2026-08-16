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

    launch_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    delivery_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    delivery_fee_rate: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    price_scale: Mapped[int | None] = mapped_column(Integer)

    min_leverage: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    max_leverage: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    leverage_step: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))

    min_price: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    max_price: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    tick_size: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))

    max_order_qty: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    min_order_qty: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    qty_step: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    post_only_max_order_qty: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    max_mkt_order_qty: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    min_notional_value: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))

    unified_margin_trade: Mapped[bool | None] = mapped_column(Boolean)
    funding_interval: Mapped[int | None] = mapped_column(Integer)
    settle_coin: Mapped[str | None] = mapped_column(String(30))
    copy_trading: Mapped[str | None] = mapped_column(String(30))
    upper_funding_rate: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))
    lower_funding_rate: Mapped[Decimal | None] = mapped_column(Numeric(20, 8))

    is_pre_listing: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    pre_listing_info: Mapped[dict | None] = mapped_column(JSONB)
    risk_parameters: Mapped[dict | None] = mapped_column(JSONB)

    display_name: Mapped[str | None] = mapped_column(String(100))
    symbol_type: Mapped[str | None] = mapped_column(String(50))
    forbid_upl_withdrawal: Mapped[bool | None] = mapped_column(Boolean)
    symbol_id: Mapped[int | None] = mapped_column(Integer)

    # Si querés conservar el payload exacto de la API, usá solo una columna.
    raw_payload: Mapped[dict | None] = mapped_column(JSONB)
