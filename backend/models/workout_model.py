from pydantic import BaseModel, Field
from typing import Optional, List
import uuid
from datetime import datetime


class Exercise(BaseModel):
    name: str
    sets: int
    reps: int
    duration: Optional[str] = None


class Workout(BaseModel):
    workout_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    coach_id: str
    athlete_id: str
    exercises: List[Exercise]
    date: str
    status: str = "pending"
    completed_at: Optional[str] = None
    completion_percentage: Optional[int] = None
    athlete_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
