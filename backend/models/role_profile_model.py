from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid
from core.utils import get_utc_now


class AthleteRoleData(BaseModel):
    sport: str
    event: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    dob: Optional[str] = None
    personal_best: Optional[str] = None
    primary_goal: Optional[str] = None
    goal_timeline: Optional[str] = None


class CoachRoleData(BaseModel):
    primary_sport: str
    specialization: str
    years_experience: int
    bio: Optional[str] = None
    certifications: Optional[List[str]] = Field(default_factory=list)


class AdminRoleData(BaseModel):
    department: Optional[str] = None
    access_level: str = "standard"


class RoleProfile(BaseModel):
    role_profile_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    account_id: str
    profile_type: str  # "athlete" | "coach" | "admin"
    athlete_data: Optional[AthleteRoleData] = None
    coach_data: Optional[CoachRoleData] = None
    admin_data: Optional[AdminRoleData] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)
