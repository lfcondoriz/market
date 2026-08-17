from datetime import datetime

from pydantic import BaseModel


class HealthCheckResponse(BaseModel):
    status: str
    database: str
    timestamp: datetime
