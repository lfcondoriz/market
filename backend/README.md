# Backend

Ejecutar el backend con:

```bash
uv run market
```

## Conectarse a la base de datos
1. Probar la conexión a la base de datos ejecutando:

    ```bash
    uv run python -m app.db.connection
    ```
2. Pruba crear tabla instrument, traer datos de bybit paginando y guardarlos en la base de datos ejecutando:

    ```bash
    uv run python -m app.ingestion.instruments
    ```
