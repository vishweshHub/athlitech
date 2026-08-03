from pydantic import BaseModel, Field
import uuid
from datetime import datetime
from typing import Optional
from core.utils import get_utc_now

class Performance(BaseModel):
    performance_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    athlete_id: str
    coach_id: str
    date: Optional[str] = None  # ISO‑8601 date string (old)
    sprint_time: Optional[float] = None # (old)
    weight: Optional[int] = None # (old)
    height: Optional[int] = None # (old)
    coach_remarks: Optional[str] = None # (old)
    
    # New Fields
    workout_id: Optional[str] = None
    sport_event: Optional[str] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    feedback: Optional[str] = None
    recorded_at: Optional[str] = None
    
    created_at: datetime = Field(default_factory=get_utc_now)

