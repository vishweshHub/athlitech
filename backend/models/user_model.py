from pydantic import BaseModel, EmailStr, model_validator
from typing import Optional
from datetime import datetime
import uuid


class User(BaseModel):
    name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: EmailStr
    hashed_password: str
    role: str = "athlete"
    coach_id: Optional[str] = None
    account_status: str = "active"
    verification_status: str = "unverified"
    profile_completed: bool = False
    onboarding_completed: bool = False
    registration_source: str = "self"
    created_at: datetime = None
    updated_at: datetime = None
    last_login: Optional[datetime] = None

    @model_validator(mode='after')
    def set_defaults(self):
        if not self.created_at:
            self.created_at = datetime.utcnow()
        if not self.updated_at:
            self.updated_at = datetime.utcnow()
        if self.role == 'coach' and not self.coach_id:
            self.coach_id = str(uuid.uuid4())
        return self
