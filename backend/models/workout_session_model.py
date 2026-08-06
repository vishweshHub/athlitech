from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from core.utils import get_utc_now


class WorkoutSession(BaseModel):
    id: str
    session_id: Optional[str] = None
    workout_template_id: Optional[str] = None
    assignment_id: Optional[str] = None
    athlete_id: str
    source_type: str = "PLANNED"  # "PLANNED" or "SELF"
    status: str = "not_started"
    started_at: datetime
    paused_at: Optional[datetime] = None
    resumed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    total_duration_seconds: int = 0
    completion_percentage: float = 0.0
    session_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

