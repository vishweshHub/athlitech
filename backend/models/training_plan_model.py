from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class TrainingPlan(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    goal: str
    athlete_id: str
    created_by: str
    owner_type: str = "self"  # "self", "coach", "system"
    start_date: str
    end_date: str
    status: str = "draft"     # "draft", "active", "completed", "archived"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TrainingWeek(BaseModel):
    id: str
    training_plan_id: str
    week_number: int
    phase_tag: str            # "Base", "Build", "Peak", "Deload"
    title: str
    target_volume: Optional[str] = None
    target_intensity: Optional[str] = None

class TrainingDay(BaseModel):
    id: str
    training_week_id: str
    date: str
    day_name: str
    day_type: str             # "Training", "Recovery", "Rest"
    notes: Optional[str] = None
