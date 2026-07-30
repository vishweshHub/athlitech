from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class MetricDefinition(BaseModel):
    id: str
    metric_key: str
    display_name: str
    unit: str
    data_type: str = "float"
    better_direction: str = "higher"  # "higher", "lower", "equal"
    sport: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
