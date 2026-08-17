from typing import Any

from sqlalchemy.orm import Session

from app.models.funding_rate import FundingRate
from app.repositories.base_repository import generic_upsert


def upsert_funding_rates(
    values: list[dict[str, Any]],
    session: Session | None = None,
) -> int:
    return generic_upsert(
        model_class=FundingRate,
        index_elements=["category", "symbol", "funding_rate_timestamp"],
        values=values,
        session=session,
    )
