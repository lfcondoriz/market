from sqlalchemy import inspect

from app.db.connection import engine
from app.models.base import Base
from app.models.instrument import Instrument


def ensure_tables_exist() -> None:
    inspector = inspect(engine)
    expected_tables = set(Base.metadata.tables.keys())

    missing_tables = sorted(
        table_name
        for table_name in expected_tables
        if not inspector.has_table(table_name)
    )

    if not missing_tables:
        print("Tablas ya existentes")
        return

    Base.metadata.create_all(
        bind=engine,
        tables=[Base.metadata.tables[name] for name in missing_tables],
    )

    print(f"Tablas creadas: {', '.join(missing_tables)}")


def create_tables() -> None:
    ensure_tables_exist()



if __name__ == "__main__":
    create_tables()