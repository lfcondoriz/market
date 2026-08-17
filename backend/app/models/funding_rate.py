from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class FundingRate(Base):
    __tablename__ = "funding_rates"

    category: Mapped[str] = mapped_column(
        String(20),
        primary_key=True,
    )

    symbol: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
    )

    funding_rate_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        primary_key=True,
    )

    funding_rate: Mapped[Decimal] = mapped_column(
        Numeric(20, 12),
        nullable=False,
    )

    settlement_timestamp: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )

    raw_payload: Mapped[dict | None] = mapped_column(JSONB)
