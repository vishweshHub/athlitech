from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class AssignmentCategoryEnum(str, Enum):
    WARM_UP = "warm_up"
    DRILL = "drill"
    MAIN = "main"
    STRENGTH = "strength"
    RECOVERY = "recovery"
    COOL_DOWN = "cool_down"
    CUSTOM = "custom"


class WorkoutAssignmentCreate(BaseModel):
    session_id: str = Field(..., min_length=1)
    workout_template_id: str = Field(..., min_length=1)
    category: AssignmentCategoryEnum
    order: int = Field(1, ge=1)
    assignment_note: Optional[str] = None
    overrides: Optional[Dict[str, Any]] = None

    @field_validator("session_id", "workout_template_id")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty or whitespace")
        return v.strip()


class WorkoutAssignmentUpdate(BaseModel):
    category: Optional[AssignmentCategoryEnum] = None
    order: Optional[int] = Field(None, ge=1)
    assignment_note: Optional[str] = None
    overrides: Optional[Dict[str, Any]] = None


class WorkoutAssignmentResponse(BaseModel):
    id: str
    session_id: str
    workout_template_id: str
    category: str
    order: int
    assignment_note: Optional[str] = None
    overrides: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
