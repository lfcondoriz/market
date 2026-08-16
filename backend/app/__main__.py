import logging

from app.db.create_tables import ensure_tables_exist
from app.ingestion.instruments import main as ingest_instruments_main

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)


def main() -> None:
    ensure_tables_exist()
    ingest_instruments_main()


if __name__ == "__main__":
    main()
