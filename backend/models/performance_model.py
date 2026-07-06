from pydantic import BaseModel, Field
import uuid
from datetime import datetime
from typing import Optional

class Performance(BaseModel):
    performance_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    athlete_id: str
    coach_id: str
    date: str  # ISO‑8601 date string
    sprint_time: float
    weight: int
    height: int
    coach_remarks: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
