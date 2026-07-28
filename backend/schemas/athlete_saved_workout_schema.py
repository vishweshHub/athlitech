from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class AthleteSavedWorkoutCreate(BaseModel):
    workout_template_id: str = Field(..., min_length=1)

    @field_validator("workout_template_id")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("workout_template_id cannot be empty or whitespace")
        return v.strip()


class AthleteSavedWorkoutResponse(BaseModel):
    id: str
    athlete_id: str
    workout_template_id: str
    created_at: datetime
    workout_template: Optional[Dict[str, Any]] = None
