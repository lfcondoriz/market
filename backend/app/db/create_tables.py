import logging

from app.db.connection import engine
from app.models.base import Base
from app.models.funding_rate import FundingRate  # noqa: F401
from app.models.instrument import Instrument  # noqa: F401
from app.models.kline import Kline  # noqa: F401

logger = logging.getLogger(__name__)


def ensure_tables_exist() -> None:
    """
    Ensure that all declared SQLAlchemy tables and indices exist in the database.
    """
    Base.metadata.create_all(bind=engine, checkfirst=True)
    logger.info("Database schema check finished")


def create_tables() -> None:
    ensure_tables_exist()


if __name__ == "__main__":
    create_tables()