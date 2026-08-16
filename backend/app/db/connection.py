from sqlalchemy import create_engine, text

from app.db.config import settings


engine = create_engine(settings.database_url)


def test_connection() -> None:
    with engine.connect() as connection:
        database = connection.execute(
            text("SELECT current_database()")
        ).scalar_one()

        print(f"Conectado correctamente a: {database}")


if __name__ == "__main__":
    test_connection()