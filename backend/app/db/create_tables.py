import logging

from sqlalchemy import inspect

from app.db.connection import engine
from app.models.base import Base
from app.models.funding_rate import FundingRate
from app.models.instrument import Instrument

logger = logging.getLogger(__name__)


def ensure_tables_exist() -> None:
    inspector = inspect(engine)
    expected_tables = set(Base.metadata.tables.keys())

    missing_tables = sorted(
        table_name
        for table_name in expected_tables
        if not inspector.has_table(table_name)
    )

    if not missing_tables:
        logger.info("Database tables already exist")
        return

    Base.metadata.create_all(
        bind=engine,
        tables=[Base.metadata.tables[name] for name in missing_tables],
    )

    logger.info("Created database tables: %s", ", ".join(missing_tables))


def create_tables() -> None:
    ensure_tables_exist()



if __name__ == "__main__":
    create_tables()