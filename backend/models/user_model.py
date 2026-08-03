from pydantic import BaseModel, EmailStr, model_validator
from typing import Optional
from datetime import datetime
import uuid
from core.utils import get_utc_now
from core.constants import ROLE_ATHLETE, ROLE_COACH, ACCOUNT_STATUS_ACTIVE, VERIFICATION_STATUS_UNVERIFIED


class User(BaseModel):
    name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: EmailStr
    hashed_password: str
    role: str = ROLE_ATHLETE
    coach_id: Optional[str] = None
    account_status: str = ACCOUNT_STATUS_ACTIVE
    verification_status: str = VERIFICATION_STATUS_UNVERIFIED
    profile_completed: bool = False
    onboarding_completed: bool = False
    registration_source: str = "self"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    @model_validator(mode='after')
    def set_defaults(self):
        if not self.created_at:
            self.created_at = get_utc_now()
        if not self.updated_at:
            self.updated_at = get_utc_now()
        if self.role == ROLE_COACH and not self.coach_id:
            self.coach_id = str(uuid.uuid4())
        return self

