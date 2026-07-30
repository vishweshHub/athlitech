from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class Session(BaseModel):
    id: str
    training_day_id: str
    session_name: str
    order: int = 1
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
