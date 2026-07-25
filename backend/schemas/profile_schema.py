from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CompleteAthleteProfileRequest(BaseModel):
    # Required
    sport: str = Field(..., min_length=1)
    event: str = Field(..., min_length=1)
    
    # Recommended
    height: Optional[float] = None
    weight: Optional[float] = None
    dob: Optional[str] = None
    
    # Optional
    personal_best: Optional[str] = None
    primary_goal: Optional[str] = None
    goal_timeline: Optional[str] = None  # "3 Months", "6 Months", "1 Year", "Custom"


class CompleteCoachProfileRequest(BaseModel):
    # Required
    primary_sport: str = Field(..., min_length=1)
    specialization: str = Field(..., min_length=1)
    years_experience: int = Field(..., ge=0)
    
    # Optional
    bio: Optional[str] = None


class RecommendationItem(BaseModel):
    title: str
    category: str
    description: str
    tags: List[str]


class ProfileResponse(BaseModel):
    user_id: str
    role: str
    profile_completed: bool
    athlete_data: Optional[dict] = None
    coach_data: Optional[dict] = None
    visibility: dict = Field(default_factory=lambda: {"bio_is_public": False, "stats_is_public": False})
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
