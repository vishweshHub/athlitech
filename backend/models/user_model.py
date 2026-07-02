from pydantic import BaseModel, EmailStr, model_validator
from typing import Optional
import uuid


class User(BaseModel):
    name: str
    email: EmailStr
    hashed_password: str
    role: str = "athlete"
    coach_id: Optional[str] = None

    @model_validator(mode='after')
    def ensure_coach_id(self):
        if self.role == 'coach' and not self.coach_id:
            self.coach_id = str(uuid.uuid4())
        return self
