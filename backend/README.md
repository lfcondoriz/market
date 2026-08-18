# Market Data Backend

Backend en Python de alto rendimiento para la ingesta, normalización, persistencia y análisis de datos de mercado cripto y derivados financieros (Bybit v5).

Construido con **FastAPI**, **SQLAlchemy 2.0**, **PostgreSQL** y gestionado con **uv**.

---

## Tabla de Contenidos

1. [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
2. [Requisitos y Configuración](#-requisitos-y-configuración)
3. [CLI de Ingesta (`market`)](#-cli-de-ingesta-market)
   - [Instrumentos](#1-instrumentos-catálogo-de-mercado)
   - [Funding Rates](#2-tasas-de-fondeo-funding-rates)
   - [Klines / Velas](#3-klines--candlesticks-enfoque-híbrido)
4. [API REST (FastAPI)](#-api-rest-fastapi)
   - [Iniciar Servidor](#iniciar-el-servidor)
   - [Catálogo de Endpoints](#catálogo-de-endpoints)
5. [Guía de Extensión para Nuevos Módulos](#-guía-de-extensión-para-futuros-módulos)

---

## 🏛 Arquitectura del Proyecto

El backend sigue un diseño modular por capas desacopladas, lo que permite extender fuentes de datos (exchanges), modelos o pipelines sin afectar el resto del sistema:

```text
backend/app/
├── api/                  # Capa HTTP (FastAPI, routers, endpoints v1)
├── db/                   # Conexión SQLAlchemy, configuración y creación de tablas
├── ingestion/            # Orquestadores de sincronización (histórico e incremental)
├── models/               # Modelos de base de datos relacional (SQLAlchemy ORM)
├── repositories/         # Capa de acceso a datos y operaciones bulk upsert
├── schemas/              # Esquemas de validación y serialización (Pydantic)
├── sources/              # Clientes y adaptadores de exchanges (Bybit v5, etc.)
├── transformations/      # Normalización y casteo de tipos de datos de mercado
├── cli.py                # Interfaz de línea de comandos unificada
└── __main__.py           # Punto de entrada para el comando `market`
```

---

## 🚀 Requisitos y Configuración

### 1. Prerrequisitos
- **Python 3.11+**
- **uv** (Gestor de paquetes rápido para Python)
- **PostgreSQL 14+**

### 2. Variables de Entorno
Crea un archivo `.env` en la raíz de `backend/`:

```env
DATABASE_URL=postgresql+psycopg://usuario:password@localhost:5432/market_db
```

### 3. Instalación de Dependencias
```bash
uv sync
```

---

## 💻 CLI de Ingesta (`market`)

El CLI permite ejecutar procesos de sincronización histórica (*backfill*) e incremental de forma automatizada o manual.

### 1. Instrumentos (Catálogo de Mercado)
Actualiza especificaciones de contratos, reglas de apalancamiento y tamaños de orden.

```bash
# Sincronizar instrumentos lineales (USDT Perpetuals)
uv run market instruments --category linear

# Sincronizar mercado Spot
uv run market instruments --category spot
```

---

### 2. Tasas de Fondeo (Funding Rates)

#### Sincronización por símbolo
```bash
# Símbolo individual
uv run market funding --category linear --symbol BTCUSDT

# Múltiples símbolos
uv run market funding --category linear --symbol BTCUSDT ETHUSDT SOLUSDT
```

#### Sincronización masiva y filtros
```bash
# Todos los instrumentos registrados
uv run market funding --category linear --all

# Filtrados por tipo de activo
uv run market funding --category linear --all --symbol-type stock
```

#### Recarga histórica forzada (`--reset-history`)
```bash
uv run market funding --category linear --symbol BTCUSDT --reset-history
```

---

### 3. Klines / Candlesticks (Enfoque Híbrido)

Permite descargar datos multitemporales de velas japonesas (*OHLCV + Turnover*) en cualquier resolución soportada por Bybit (`1`, `3`, `5`, `15`, `30`, `60`, `120`, `240`, `360`, `720`, `D`, `W`, `M`).

#### Sincronización por símbolo e intervalo
```bash
# Intervalo de 1 minuto (por defecto: 1)
uv run market klines --category linear --symbol BTCUSDT

# Intervalos intradiarios / swing (ej. 15m, 1h, 4h, 1D, 1W)
uv run market klines --category linear --symbol BTCUSDT --interval 15
uv run market klines --category linear --symbol BTCUSDT --interval 60
uv run market klines --category linear --symbol BTCUSDT --interval 240
uv run market klines --category linear --symbol BTCUSDT --interval D
uv run market klines --category linear --symbol BTCUSDT --interval W
```

#### Sincronización múltiple y masiva
```bash
# Varios símbolos en simultáneo
uv run market klines --category linear --symbol BTCUSDT ETHUSDT SOLUSDT --interval 60

# Todo el universo de mercado en velas diarias
uv run market klines --category linear --all --interval D

# Filtrado por tipo de símbolo en velas de 1 hora
uv run market klines --category linear --all --symbol-type stock --interval 60
```

#### Recarga histórica forzada
```bash
uv run market klines --category linear --symbol BTCUSDT --interval 60 --reset-history
```

---

## 🌐 API REST (FastAPI)

### Iniciar el Servidor
```bash
uv run uvicorn app.api.main:app --reload
```

- **Swagger UI (Docs)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### Catálogo de Endpoints

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Estado del servicio y conectividad con la base de datos |
| `GET` | `/api/v1/instruments` | Lista paginada con filtros (`category`, `symbol_type`, `search`) |
| `GET` | `/api/v1/instruments/{symbol}` | Especificaciones técnicas y metadatos del contrato |
| `GET` | `/api/v1/funding-rates/summary` | Resumen de mercado: Top tasas positivas/negativas y APR estimado |
| `GET` | `/api/v1/funding-rates/{symbol}` | Histórico de tasas de fondeo formateado para gráficos |

---

## 🧩 Guía de Extensión para Futuros Módulos

Para agregar un nuevo tipo de dato (ej. *Orderbook*, *Trades*, *Liquidations*) u otro exchange, sigue este flujo estándar de 5 pasos:

1. **Fuente (`sources/<exchange>/<modulo>_source.py`)**:
   Implementa la función de consulta cruda a la API respetando límites de página y paginación temporal.
2. **Modelo y Esquema (`models/<modulo>.py` & `schemas/<modulo>.py`)**:
   Define la tabla en SQLAlchemy (con clave compuesta única) y sus esquemas Pydantic.
3. **Transformador (`transformations/<modulo>_transformer.py`)**:
   Parsea y tipa las respuestas crudas (casteo a `Decimal`, timestamps UTC).
4. **Repositorio (`repositories/<modulo>_repository.py`)**:
   Implementa las consultas de lectura y el *bulk upsert* reutilizando `generic_upsert`.
5. **Ingesta y CLI (`ingestion/<modulo>.py` & `cli.py`)**:
   Crea la lógica de sincronización incremental e integra el nuevo subcomando en el parser CLI.