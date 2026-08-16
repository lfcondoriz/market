from app.db.connection import engine
from app.models.base import Base
from app.models.instrument import Instrument


def create_tables() -> None:
    Base.metadata.create_all(bind=engine)

    print("Tablas creadas correctamente")


if __name__ == "__main__":
    create_tables()