from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class DifficultyEnum(str, Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"


class WorkoutCreate(BaseModel):
    title: str = Field(..., description="Workout title")
    description: Optional[str] = None
    sport: str = Field(..., description="Sport name")
    category: str = Field(..., description="Workout category")
    difficulty: DifficultyEnum
    duration_minutes: int = Field(..., gt=0, description="Duration in minutes, must be greater than 0")
    equipment: Optional[List[str]] = Field(default_factory=list)
    instructions: Optional[str] = None
    is_public: bool = True

    @field_validator("title", "sport", "category", mode="before")
    def validate_non_empty_string(cls, v):
        if isinstance(v, str):
            v_stripped = v.strip()
            if not v_stripped:
                raise ValueError("Field cannot be empty or only whitespace")
            return v_stripped
        return v

    @field_validator("description", "instructions", mode="before")
    def trim_optional_string(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("equipment", mode="before")
    def trim_equipment(cls, v):
        if isinstance(v, list):
            return [item.strip() for item in v if isinstance(item, str) and item.strip()]
        return v or []


class WorkoutUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    sport: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[DifficultyEnum] = None
    duration_minutes: Optional[int] = Field(None, gt=0)
    equipment: Optional[List[str]] = None
    instructions: Optional[str] = None
    is_public: Optional[bool] = None

    @field_validator("title", "sport", "category", mode="before")
    def validate_optional_non_empty_string(cls, v):
        if v is not None and isinstance(v, str):
            v_stripped = v.strip()
            if not v_stripped:
                raise ValueError("Field cannot be empty or only whitespace")
            return v_stripped
        return v

    @field_validator("description", "instructions", mode="before")
    def trim_optional_string(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("equipment", mode="before")
    def trim_equipment(cls, v):
        if isinstance(v, list):
            return [item.strip() for item in v if isinstance(item, str) and item.strip()]
        return v


class WorkoutResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    sport: str
    category: str
    difficulty: str
    duration_minutes: int
    equipment: List[str] = Field(default_factory=list)
    instructions: Optional[str] = None
    created_by: str
    created_by_role: str
    is_public: bool
    created_at: datetime
    updated_at: datetime


# Legacy Schemas (for backward compatibility)
class ExerciseSchema(BaseModel):
    name: str = Field(..., min_length=1)
    sets: int = Field(..., gt=0)
    reps: int = Field(..., gt=0)
    duration: Optional[str] = None


class WorkoutCreateLegacy(BaseModel):
    workout_template_id: Optional[str] = None
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    athlete_id: str = Field(..., min_length=1)
    exercises: List[ExerciseSchema]
    date: str = Field(..., min_length=1)
    status: str = "pending"


class WorkoutUpdateStatus(BaseModel):
    status: str = Field(..., pattern="^(pending|completed|skipped)$")
    completed_at: Optional[str] = None
    completion_percentage: Optional[int] = Field(None, ge=0, le=100)
    athlete_notes: Optional[str] = None


class WorkoutRead(BaseModel):
    workout_id: str
    workout_template_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    coach_id: str
    athlete_id: str
    exercises: List[ExerciseSchema]
    date: str
    status: str
    completed_at: Optional[str] = None
    completion_percentage: Optional[int] = None
    athlete_notes: Optional[str] = None
    created_at: datetime
