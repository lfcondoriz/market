import logging
from typing import Any, Type

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.db.connection import engine
from app.models.base import Base

logger = logging.getLogger(__name__)

DEFAULT_UPSERT_CHUNK_SIZE = 2000


def generic_upsert(
    model_class: Type[Base],
    index_elements: list[str],
    values: list[dict[str, Any]],
    session: Session | None = None,
    chunk_size: int = DEFAULT_UPSERT_CHUNK_SIZE,
) -> int:
    """
    Perform a PostgreSQL ON CONFLICT DO UPDATE (upsert) for any SQLAlchemy model,
    chunking large payloads to avoid exceeding PostgreSQL parameter limits (65535).
    """
    if not values:
        return 0

    pk_set = set(index_elements)

    def _execute(db: Session) -> int:
        total_processed = 0

        for i in range(0, len(values), chunk_size):
            chunk = values[i : i + chunk_size]

            statement = insert(model_class).values(chunk)
            excluded = statement.excluded

            update_columns = {
                column.name: getattr(excluded, column.name)
                for column in model_class.__table__.columns
                if column.name not in pk_set
            }

            statement = statement.on_conflict_do_update(
                index_elements=index_elements,
                set_=update_columns,
            ).returning(model_class)

            result = db.execute(statement)
            total_processed += len(result.all())

        if session is None:
            db.commit()

        return total_processed

    if session is not None:
        return _execute(session)

    with Session(engine) as database:
        return _execute(database)
