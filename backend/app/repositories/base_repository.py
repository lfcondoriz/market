import logging
from typing import Any, Type

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.db.connection import engine
from app.models.base import Base

logger = logging.getLogger(__name__)


def generic_upsert(
    model_class: Type[Base],
    index_elements: list[str],
    values: list[dict[str, Any]],
    session: Session | None = None,
) -> int:
    """
    Perform a PostgreSQL ON CONFLICT DO UPDATE (upsert) for any SQLAlchemy model.
    """
    if not values:
        return 0

    statement = insert(model_class).values(values)
    excluded = statement.excluded

    pk_set = set(index_elements)
    update_columns = {
        column.name: getattr(excluded, column.name)
        for column in model_class.__table__.columns
        if column.name not in pk_set
    }

    statement = statement.on_conflict_do_update(
        index_elements=index_elements,
        set_=update_columns,
    ).returning(model_class)

    def _execute(db: Session) -> int:
        result = db.execute(statement)
        processed = len(result.all())
        if session is None:
            db.commit()
        return processed

    if session is not None:
        return _execute(session)

    with Session(engine) as database:
        return _execute(database)
