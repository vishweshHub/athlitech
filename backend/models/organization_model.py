from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
import uuid
from core.utils import get_utc_now
from core.constants import STATUS_ACTIVE


class Organization(BaseModel):
    organization_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    owner_account_id: str
    status: str = STATUS_ACTIVE
    logo_url: Optional[str] = None
    subscription_id: Optional[str] = None
    settings: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)
