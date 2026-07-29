from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class SourceTypeEnum(str, Enum):
    SELF_WORKOUT = "SELF_WORKOUT"
    COACH_PLAN = "COACH_PLAN"
    SELF = "SELF"
    PLANNED = "PLANNED"
    MANUAL = "manual"
    COACH = "coach"
    WEARABLE = "wearable"
    AI = "ai"


class PerformanceLogCreate(BaseModel):
    workout_session_id: str = Field(..., min_length=1)
    workout_template_id: Optional[str] = None
    assignment_id: Optional[str] = None
    activity_label: Optional[str] = None
    workout_name: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None
    source_type: Optional[str] = "manual"

    duration_minutes: Optional[int] = 0
    perceived_effort: Optional[int] = Field(5, ge=1, le=10)
    completion_rating: Optional[int] = Field(5, ge=1, le=5)

    notes: Optional[str] = None
    completed_at: Optional[datetime] = None
    recorded_at: Optional[datetime] = None

    @field_validator("workout_session_id")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty or whitespace")
        return v.strip()


class PerformanceLogResponse(BaseModel):
    id: str
    workout_session_id: str
    athlete_id: str
    workout_template_id: Optional[str] = None
    assignment_id: Optional[str] = None
    source_type: str = "SELF"
    workout_name: str = "Workout Session"
    activity_label: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None

    completed_at: datetime
    duration_minutes: int = 0
    perceived_effort: int = 5
    completion_rating: int = 5
    notes: Optional[str] = None
    is_personal_record: bool = False

    created_at: datetime
    updated_at: datetime
