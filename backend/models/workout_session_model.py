from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class WorkoutSession(BaseModel):
    id: str
    session_id: str
    athlete_id: str
    status: str = "not_started"
    started_at: datetime
    paused_at: Optional[datetime] = None
    resumed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    total_duration_seconds: int = 0
    completion_percentage: float = 0.0
    session_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
