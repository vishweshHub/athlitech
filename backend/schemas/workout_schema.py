from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ExerciseSchema(BaseModel):
    name: str = Field(..., min_length=1)
    sets: int = Field(..., gt=0)
    reps: int = Field(..., gt=0)
    duration: Optional[str] = None


class WorkoutCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    athlete_id: str = Field(..., min_length=1)
    exercises: List[ExerciseSchema]
    date: str = Field(..., min_length=1)
    status: str = "pending"


class WorkoutUpdateStatus(BaseModel):
    status: str = Field(..., pattern="^(pending|completed|skipped)$")


class WorkoutRead(BaseModel):
    workout_id: str
    title: str
    description: Optional[str] = None
    coach_id: str
    athlete_id: str
    exercises: List[ExerciseSchema]
    date: str
    status: str
    created_at: datetime
