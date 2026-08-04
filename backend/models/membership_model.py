from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid
from core.utils import get_utc_now
from core.constants import STATUS_ACTIVE


class Membership(BaseModel):
    membership_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    account_id: str
    organization_id: str
    role_profile_id: Optional[str] = None
    role: str  # "owner" | "admin" | "coach" | "athlete"
    status: str = STATUS_ACTIVE
    assigned_coach_membership_id: Optional[str] = None
    teams: List[str] = Field(default_factory=list)
    permissions: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)
