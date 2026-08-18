from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Kline(Base):
    __tablename__ = "klines"

    category: Mapped[str] = mapped_column(
        String(20),
        primary_key=True,
    )

    symbol: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
    )

    interval: Mapped[str] = mapped_column(
        String(10),
        primary_key=True,
    )

    open_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        primary_key=True,
    )

    open_price: Mapped[Decimal] = mapped_column(
        Numeric(24, 8),
        nullable=False,
    )

    high_price: Mapped[Decimal] = mapped_column(
        Numeric(24, 8),
        nullable=False,
    )

    low_price: Mapped[Decimal] = mapped_column(
        Numeric(24, 8),
        nullable=False,
    )

    close_price: Mapped[Decimal] = mapped_column(
        Numeric(24, 8),
        nullable=False,
    )

    volume: Mapped[Decimal] = mapped_column(
        Numeric(32, 8),
        nullable=False,
    )

    turnover: Mapped[Decimal | None] = mapped_column(
        Numeric(36, 8),
    )
