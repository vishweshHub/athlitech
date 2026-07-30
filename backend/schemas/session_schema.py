from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class SessionCreate(BaseModel):
    training_day_id: str = Field(..., min_length=1)
    session_name: str = Field(..., min_length=1)
    order: int = Field(1, ge=1)
    start_time: Optional[str] = None
    end_time: Optional[str] = None

    @field_validator("training_day_id", "session_name")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty or whitespace")
        return v.strip()


class SessionUpdate(BaseModel):
    session_name: Optional[str] = None
    order: Optional[int] = Field(None, ge=1)
    start_time: Optional[str] = None
    end_time: Optional[str] = None

    @field_validator("session_name")
    @classmethod
    def validate_non_empty_optional(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Field cannot be empty or whitespace")
        return v.strip() if v else v


class SessionResponse(BaseModel):
    id: str
    training_day_id: str
    session_name: str
    order: int
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    created_at: datetime
    updated_at: datetime
