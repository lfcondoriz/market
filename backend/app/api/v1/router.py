from fastapi import APIRouter

from app.api.v1.endpoints import funding_rates, health, instruments

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(instruments.router, prefix="/instruments", tags=["Instruments"])
api_router.include_router(funding_rates.router, prefix="/funding-rates", tags=["Funding Rates"])
