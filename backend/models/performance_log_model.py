from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from core.utils import get_utc_now


class PerformanceLog(BaseModel):
    id: str
    workout_session_id: str
    assignment_id: Optional[str] = None
    athlete_id: str
    activity_label: Optional[str] = None
    metrics: Dict[str, Any] = Field(default_factory=dict)
    source_type: str = "manual"
    notes: Optional[str] = None
    is_personal_record: bool = False
    recorded_at: datetime = Field(default_factory=get_utc_now)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

