from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PerformanceCreate(BaseModel):
    athlete_id: str = Field(..., min_length=1)
    date: Optional[str] = None
    sprint_time: Optional[float] = None
    weight: Optional[int] = None
    height: Optional[int] = None
    coach_remarks: Optional[str] = None
    
    # New Fields
    workout_id: Optional[str] = None
    sport_event: Optional[str] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    feedback: Optional[str] = None
    recorded_at: Optional[str] = None


class PerformanceRead(BaseModel):
    performance_id: str
    athlete_id: str
    coach_id: str
    date: Optional[str] = None
    sprint_time: Optional[float] = None
    weight: Optional[int] = None
    height: Optional[int] = None
    coach_remarks: Optional[str] = None
    
    # New Fields
    workout_id: Optional[str] = None
    sport_event: Optional[str] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    feedback: Optional[str] = None
    recorded_at: Optional[str] = None
    
    created_at: datetime

