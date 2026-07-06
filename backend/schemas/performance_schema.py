from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PerformanceCreate(BaseModel):
    athlete_id: str = Field(..., min_length=1)
    date: str = Field(..., min_length=1)
    sprint_time: float = Field(..., gt=0)
    weight: int = Field(..., gt=0)
    height: int = Field(..., gt=0)
    coach_remarks: Optional[str] = None


class PerformanceRead(BaseModel):
    performance_id: str
    athlete_id: str
    coach_id: str
    date: str
    sprint_time: float
    weight: int
    height: int
    coach_remarks: Optional[str] = None
    created_at: datetime

