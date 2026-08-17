# Backend

Backend en Python (FastAPI + SQLAlchemy 2.0 + PostgreSQL) para ingesta de datos de mercado y API REST de analíticas financieras.

---

### 1. Iniciar el Servidor de API REST (FastAPI)

Para iniciar el servidor HTTP para desarrollo:

```bash
uv run uvicorn app.api.main:app --reload
```

- **Documentación Interactiva (Swagger UI)**: `http://localhost:8000/docs`
- **Documentación ReDoc**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/api/v1/health`

---

### 2. Endpoints Principales de la API REST

- `GET /api/v1/instruments` (Lista paginada con filtros por `category`, `symbol_type` y `search`)
- `GET /api/v1/instruments/{symbol}` (Detalle técnico del símbolo)
- `GET /api/v1/funding-rates/summary` (Resumen de mercado: Top tasas positivas/negativas y estimado APR %)
- `GET /api/v1/funding-rates/{symbol}` (Histórico de tasas de fondeo formateado para TradingView Lightweight Charts)

---

### 3. Ingesta por Línea de Comandos (CLI `market`)

#### Actualizar instrumentos

```bash
uv run market instruments --category linear
```

#### Ingestar Funding Rates de un símbolo o varios

```bash
uv run market funding --category linear --symbol BTCUSDT
uv run market funding --category linear --symbol BTCUSDT ETHUSDT
```

#### Ingestar Funding Rates de todos los símbolos (o filtrados por tipo)

```bash
uv run market funding --category linear --all
uv run market funding --category linear --all --symbol-type stock
```

#### Realizar Backfill Completo (`--reset-history`)

```bash
uv run market funding --category linear --symbol BTCUSDT --reset-history
```

---

### 4. Utilidades Secundarias

1. Probar la conexión a la base de datos:

    ```bash
    uv run python -m app.db.connection
    ```

2. Ejecutar la ingesta directa de instrumentos:

    ```bash
    uv run python -m app.ingestion.instruments
    ```