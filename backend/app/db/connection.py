import logging

from sqlalchemy import create_engine, text

from app.db.config import settings

logger = logging.getLogger(__name__)

engine = create_engine(settings.database_url)


def test_connection() -> None:
    with engine.connect() as connection:
        database = connection.execute(
            text("SELECT current_database()")
        ).scalar_one()

        logger.info("Database connection successful: %s", database)


if __name__ == "__main__":
    test_connection()