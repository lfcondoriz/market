from fastapi import APIRouter, HTTPException, Query

from app.schemas.instrument import InstrumentResponse, PaginatedResponse
from app.services import instrument_service

router = APIRouter()


@router.get("", response_model=PaginatedResponse[InstrumentResponse])
def list_instruments(
    category: str = Query("linear", description="Bybit category (e.g. linear, spot)"),
    symbol_type: str | None = Query(None, description="Filter by symbol type (e.g. stock, innovation)"),
    search: str | None = Query(None, description="Search term for symbol or base coin"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=5000, description="Items per page"),
):
    """
    Get a paginated list of market instruments with optional filtering by type or search term.
    """
    return instrument_service.get_paginated_instruments(
        category=category,
        symbol_type=symbol_type,
        search=search,
        page=page,
        limit=limit,
    )


@router.get("/{symbol}", response_model=InstrumentResponse)
def get_instrument_detail(
    symbol: str,
    category: str = Query("linear", description="Bybit category"),
):
    """
    Get detailed specification of a specific instrument symbol.
    """
    instrument = instrument_service.get_instrument_by_symbol(
        category=category,
        symbol=symbol.upper(),
    )
    if not instrument:
        raise HTTPException(
            status_code=404,
            detail=f"Instrument '{symbol}' not found in category '{category}'",
        )
    return instrument
