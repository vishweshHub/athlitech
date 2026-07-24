from enum import Enum
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class OwnerTypeEnum(str, Enum):
    SELF = "self"
    COACH = "coach"
    SYSTEM = "system"


class StatusEnum(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class PhaseTagEnum(str, Enum):
    BASE = "Base"
    BUILD = "Build"
    PEAK = "Peak"
    DELOAD = "Deload"


class DayTypeEnum(str, Enum):
    TRAINING = "Training"
    RECOVERY = "Recovery"
    REST = "Rest"


# --- Training Plan Schemas ---

class TrainingPlanCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    goal: str = Field(..., min_length=1)
    athlete_id: str = Field(..., min_length=1)
    owner_type: Optional[OwnerTypeEnum] = OwnerTypeEnum.SELF
    start_date: str = Field(..., min_length=1)
    end_date: str = Field(..., min_length=1)
    status: Optional[StatusEnum] = StatusEnum.DRAFT

    @field_validator("title", "goal", "athlete_id", "start_date", "end_date")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty or whitespace")
        return v.strip()


class TrainingPlanUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    goal: Optional[str] = None
    status: Optional[StatusEnum] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

    @field_validator("title", "goal", "start_date", "end_date")
    @classmethod
    def validate_non_empty_optional(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Field cannot be empty or whitespace")
        return v.strip() if v else v


class TrainingPlanResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    goal: str
    athlete_id: str
    created_by: str
    owner_type: str
    start_date: str
    end_date: str
    status: str
    created_at: datetime
    updated_at: datetime


# --- Training Week Schemas ---

class TrainingWeekCreate(BaseModel):
    training_plan_id: str = Field(..., min_length=1)
    week_number: int = Field(..., ge=1)
    phase_tag: PhaseTagEnum
    title: str = Field(..., min_length=1)
    target_volume: Optional[str] = None
    target_intensity: Optional[str] = None

    @field_validator("training_plan_id", "title")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty or whitespace")
        return v.strip()


class TrainingWeekUpdate(BaseModel):
    week_number: Optional[int] = Field(None, ge=1)
    phase_tag: Optional[PhaseTagEnum] = None
    title: Optional[str] = None
    target_volume: Optional[str] = None
    target_intensity: Optional[str] = None

    @field_validator("title")
    @classmethod
    def validate_non_empty_optional(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Field cannot be empty or whitespace")
        return v.strip() if v else v


class TrainingWeekResponse(BaseModel):
    id: str
    training_plan_id: str
    week_number: int
    phase_tag: str
    title: str
    target_volume: Optional[str] = None
    target_intensity: Optional[str] = None


# --- Training Day Schemas ---

class TrainingDayCreate(BaseModel):
    training_week_id: str = Field(..., min_length=1)
    date: str = Field(..., min_length=1)
    day_name: str = Field(..., min_length=1)
    day_type: DayTypeEnum
    notes: Optional[str] = None

    @field_validator("training_week_id", "date", "day_name")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty or whitespace")
        return v.strip()


class TrainingDayUpdate(BaseModel):
    date: Optional[str] = None
    day_name: Optional[str] = None
    day_type: Optional[DayTypeEnum] = None
    notes: Optional[str] = None

    @field_validator("date", "day_name")
    @classmethod
    def validate_non_empty_optional(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Field cannot be empty or whitespace")
        return v.strip() if v else v


class TrainingDayResponse(BaseModel):
    id: str
    training_week_id: str
    date: str
    day_name: str
    day_type: str
    notes: Optional[str] = None
