from pydantic import BaseModel, Field, model_validator
from typing import Optional, List
import uuid
from datetime import datetime


class Exercise(BaseModel):
    name: str
    sets: int
    reps: int
    duration: Optional[str] = None


class Workout(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workout_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    sport: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    duration_minutes: Optional[int] = None
    equipment: List[str] = Field(default_factory=list)
    instructions: Optional[str] = None
    created_by: Optional[str] = None
    created_by_role: Optional[str] = None
    is_public: bool = True

    # Legacy fields
    coach_id: Optional[str] = None
    athlete_id: Optional[str] = None
    exercises: Optional[List[Exercise]] = None
    date: Optional[str] = None
    status: str = "pending"
    completed_at: Optional[str] = None
    completion_percentage: Optional[int] = None
    athlete_notes: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @model_validator(mode='after')
    def set_defaults(self):
        if not self.workout_id:
            self.workout_id = self.id
        return self
