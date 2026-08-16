# market

# Base de datos
## Docker Compose

Instalar dependencias y levantar el proyecto con:

```bash
docker compose up --build
```

Borrar la base de datos:

```bash
docker compose down -v
```

Conectar a la base de datos:

```bash
docker exec -it market-database psql -U fernk -d market
```
- `\dt`: Listar tablas
- `\d <table_name>`: Ver detalles de una tabla
- `\q`: Salir de psql
