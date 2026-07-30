from datetime import datetime
from pydantic import BaseModel, Field


class AthleteSavedWorkout(BaseModel):
    id: str
    athlete_id: str
    workout_template_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
