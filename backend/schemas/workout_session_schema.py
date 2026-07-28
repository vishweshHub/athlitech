from enum import Enum
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class WorkoutSessionStatusEnum(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class WorkoutSessionSourceTypeEnum(str, Enum):
    PLANNED = "PLANNED"
    SELF = "SELF"


class WorkoutSessionStartRequest(BaseModel):
    session_id: Optional[str] = None
    workout_template_id: Optional[str] = None
    assignment_id: Optional[str] = None
    session_notes: Optional[str] = None


class WorkoutSessionCompleteRequest(BaseModel):
    completion_percentage: Optional[float] = Field(100.0, ge=0.0, le=100.0)
    session_notes: Optional[str] = None


class WorkoutSessionCancelRequest(BaseModel):
    session_notes: Optional[str] = None


class WorkoutSessionResponse(BaseModel):
    id: str
    session_id: Optional[str] = None
    workout_template_id: Optional[str] = None
    assignment_id: Optional[str] = None
    athlete_id: str
    source_type: str = "PLANNED"
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
