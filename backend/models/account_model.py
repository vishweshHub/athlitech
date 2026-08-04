from pydantic import BaseModel, EmailStr, Field, model_validator
from typing import Optional
from datetime import datetime
import uuid
from core.utils import get_utc_now
from core.constants import ACCOUNT_STATUS_ACTIVE, VERIFICATION_STATUS_UNVERIFIED


class Account(BaseModel):
    account_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    hashed_password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    name: Optional[str] = None
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
        if not self.name and (self.first_name or self.last_name):
            self.name = f"{self.first_name or ''} {self.last_name or ''}".strip()
        return self
