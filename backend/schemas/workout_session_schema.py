from enum import Enum
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class WorkoutSessionStatusEnum(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class WorkoutSessionStartRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    session_notes: Optional[str] = None

    @field_validator("session_id")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty or whitespace")
        return v.strip()


class WorkoutSessionCompleteRequest(BaseModel):
    completion_percentage: Optional[float] = Field(100.0, ge=0.0, le=100.0)
    session_notes: Optional[str] = None


class WorkoutSessionCancelRequest(BaseModel):
    session_notes: Optional[str] = None


class WorkoutSessionResponse(BaseModel):
    id: str
    session_id: str
    athlete_id: str
    status: str
    started_at: datetime
    paused_at: Optional[datetime] = None
    resumed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    total_duration_seconds: int
    completion_percentage: float
    session_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
