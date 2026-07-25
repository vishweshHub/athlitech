from pydantic import BaseModel, Field
from typing import Optional
import uuid


class Athlete(BaseModel):
    athlete_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    sport: str
    weight: int
    coach_id: Optional[str] = None