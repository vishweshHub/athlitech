from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from core.utils import get_utc_now


class WorkoutAssignment(BaseModel):
    id: str
    session_id: str
    workout_template_id: str
    category: str
    order: int = 1
    assignment_note: Optional[str] = None
    overrides: Optional[Dict[str, Any]] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

