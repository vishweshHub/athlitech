from enum import Enum
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class BetterDirectionEnum(str, Enum):
    HIGHER = "higher"
    LOWER = "lower"
    EQUAL = "equal"


class MetricDefinitionCreate(BaseModel):
    metric_key: str = Field(..., min_length=1)
    display_name: str = Field(..., min_length=1)
    unit: str = Field(..., min_length=1)
    data_type: Optional[str] = "float"
    better_direction: BetterDirectionEnum = BetterDirectionEnum.HIGHER
    sport: Optional[str] = None

    @field_validator("metric_key", "display_name", "unit")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty or whitespace")
        return v.strip()


class MetricDefinitionResponse(BaseModel):
    id: str
    metric_key: str
    display_name: str
    unit: str
    data_type: str
    better_direction: str
    sport: Optional[str] = None
    created_at: datetime
    updated_at: datetime
