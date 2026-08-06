from datetime import datetime
from pydantic import BaseModel, Field
from core.utils import get_utc_now


class AthleteSavedWorkout(BaseModel):
    id: str
    athlete_id: str
    workout_template_id: str
    created_at: datetime = Field(default_factory=get_utc_now)

