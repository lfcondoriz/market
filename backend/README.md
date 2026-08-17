
# Backend

Ejecutar el backend con la CLI `market`:

### Uso de `uv run market`

El comando valida las tablas requeridas y crea solo las faltantes antes de iniciar cualquier operación de ingesta.

#### 1. Actualizar instrumentos

```bash
uv run market instruments --category linear
```

#### 2. Ingestar Funding Rates de un símbolo o varios

```bash
uv run market funding --category linear --symbol BTCUSDT
uv run market funding --category linear --symbol BTCUSDT ETHUSDT
```

#### 3. Ingestar Funding Rates de todos los símbolos (o filtrados por tipo)

```bash
uv run market funding --category linear --all
uv run market funding --category linear --all --symbol-type stock
```

#### 4. Realizar Backfill Completo (`--reset-history`)

```bash
uv run market funding --category linear --symbol BTCUSDT --reset-history
```

---

## Conectarse a la base de datos y comandos secundarios

1. Probar la conexión a la base de datos ejecutando:

    ```bash
    uv run python -m app.db.connection
    ```

2. Ejecutar la ingesta de instrumentos directamente (la verificación y creación de tablas faltantes es automática):

    ```bash
    uv run python -m app.ingestion.instruments
    ```