from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class SourceTypeEnum(str, Enum):
    MANUAL = "manual"
    COACH = "coach"
    WEARABLE = "wearable"
    AI = "ai"


class PerformanceLogCreate(BaseModel):
    workout_session_id: str = Field(..., min_length=1)
    assignment_id: str = Field(..., min_length=1)
    activity_label: str = Field(..., min_length=1)
    metrics: Dict[str, Any] = Field(..., min_length=1)
    source_type: Optional[SourceTypeEnum] = SourceTypeEnum.MANUAL

    notes: Optional[str] = None
    recorded_at: Optional[datetime] = None

    @field_validator("workout_session_id", "assignment_id", "activity_label")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty or whitespace")
        return v.strip()


class PerformanceLogResponse(BaseModel):
    id: str
    workout_session_id: str
    assignment_id: str
    athlete_id: str
    activity_label: str
    metrics: Dict[str, Any]
    source_type: str
    notes: Optional[str] = None
    is_personal_record: bool
    recorded_at: datetime
    created_at: datetime
    updated_at: datetime
