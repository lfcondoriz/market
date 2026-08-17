from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.db.create_tables import ensure_tables_exist


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables and indices exist on startup
    ensure_tables_exist()
    yield


app = FastAPI(
    title="Market Data Analytics API",
    description=(
        "REST API serving market instruments and historical funding rate "
        "analytics formatted for TradingView Lightweight Charts."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware to allow requests from React frontend (e.g. http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/", include_in_schema=False)
def root():
    return {
        "message": "Market Data Analytics API is running",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
