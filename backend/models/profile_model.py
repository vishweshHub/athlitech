from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProfileVisibility(BaseModel):
    bio_is_public: bool = False
    stats_is_public: bool = False


class AthleteProfileData(BaseModel):
    # Required
    sport: str
    event: str
    
    # Recommended
    height: Optional[float] = None
    weight: Optional[float] = None
    dob: Optional[str] = None
    
    # Optional
    personal_best: Optional[str] = None
    primary_goal: Optional[str] = None
    goal_timeline: Optional[str] = None


class CoachProfileData(BaseModel):
    # Required
    primary_sport: str
    specialization: str
    years_experience: int
    
    # Optional
    bio: Optional[str] = None


class Profile(BaseModel):
    user_id: str
    role: str
    athlete_data: Optional[AthleteProfileData] = None
    coach_data: Optional[CoachProfileData] = None
    visibility: ProfileVisibility = Field(default_factory=ProfileVisibility)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
