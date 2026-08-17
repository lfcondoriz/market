from math import ceil
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.connection import engine
from app.models.instrument import Instrument
from app.schemas.instrument import InstrumentResponse, PaginatedResponse


def get_paginated_instruments(
    category: str = "linear",
    symbol_type: str | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 50,
    session: Session | None = None,
) -> PaginatedResponse[InstrumentResponse]:
    def _execute(db: Session) -> PaginatedResponse[InstrumentResponse]:
        query = select(Instrument).where(Instrument.category == category)

        if symbol_type:
            query = query.where(Instrument.symbol_type == symbol_type)

        if search:
            search_pattern = f"%{search.upper()}%"
            query = query.where(
                (Instrument.symbol.ilike(search_pattern))
                | (Instrument.base_coin.ilike(search_pattern))
            )

        # Count total items matching filter
        count_query = select(func.count()).select_from(query.subquery())
        total = db.execute(count_query).scalar() or 0

        # Apply pagination
        offset = (page - 1) * limit
        paginated_query = query.order_by(Instrument.symbol.asc()).offset(offset).limit(limit)
        items = db.execute(paginated_query).scalars().all()

        total_pages = ceil(total / limit) if total > 0 else 1

        return PaginatedResponse(
            items=[InstrumentResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    if session:
        return _execute(session)
    with Session(engine) as database:
        return _execute(database)


def get_instrument_by_symbol(
    category: str,
    symbol: str,
    session: Session | None = None,
) -> InstrumentResponse | None:
    def _execute(db: Session) -> InstrumentResponse | None:
        query = select(Instrument).where(
            Instrument.category == category,
            Instrument.symbol == symbol,
        )
        item = db.execute(query).scalar_one_or_none()
        return InstrumentResponse.model_validate(item) if item else None

    if session:
        return _execute(session)
    with Session(engine) as database:
        return _execute(database)
