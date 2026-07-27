from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class PerformanceLog(BaseModel):
    id: str
    workout_session_id: str
    assignment_id: str
    athlete_id: str
    activity_label: str
    metrics: Dict[str, Any] = Field(default_factory=dict)
    source_type: str = "manual"
    notes: Optional[str] = None
    is_personal_record: bool = False
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
