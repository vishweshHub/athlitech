from pydantic import BaseModel, Field
from typing import Optional


class AthleteCreate(BaseModel):
    name: str = Field(..., min_length=1)
    sport: str = Field(..., min_length=1)
    weight: int
    coach_id: Optional[str] = None


class AthleteRead(BaseModel):
    athlete_id: str
    name: str
    sport: str
    weight: int
    coach_id: Optional[str] = None
