from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid
from core.utils import get_utc_now
from core.constants import STATUS_ACTIVE


class Subscription(BaseModel):
    subscription_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organization_id: str
    plan_tier: str = "free"  # "free" | "pro" | "enterprise"
    status: str = STATUS_ACTIVE
    max_athletes: int = 50
    max_coaches: int = 5
    features: List[str] = Field(default_factory=list)
    current_period_start: datetime = Field(default_factory=get_utc_now)
    current_period_end: Optional[datetime] = None
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)
