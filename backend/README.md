# Backend

Ejecutar el backend con:

```bash
uv run market
```

El comando valida las tablas requeridas y crea solo las faltantes antes de iniciar la ingesta.

## Conectarse a la base de datos
1. Probar la conexión a la base de datos ejecutando:

    ```bash
    uv run python -m app.db.connection
    ```
2. Ejecutar la ingesta directamente (la verificacion y creacion de tablas faltantes es automatica):

    ```bash
    uv run python -m app.ingestion.instruments
    ```
