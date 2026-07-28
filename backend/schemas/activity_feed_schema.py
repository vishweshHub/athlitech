from typing import List, Optional, Union
from pydantic import BaseModel, Field


class HeadlineMetric(BaseModel):
    label: str
    value: Union[float, int, str]
    unit: str = ""


class ActivityFeedSessionCard(BaseModel):
    workout_session_id: str
    title: str
    sport: str = "General"
    status: str
    completion_percentage: float = 0.0
    duration_minutes: int = 0
    headline_metrics: List[HeadlineMetric] = Field(default_factory=list)
    badges: List[str] = Field(default_factory=list)


class ActivityFeedDayGroup(BaseModel):
    date: str
    gap_days_before: int = 0
    sessions_completed: int = 0
    sessions_planned: int = 0
    sessions: List[ActivityFeedSessionCard] = Field(default_factory=list)


class ActivityFeedResponse(BaseModel):
    days: List[ActivityFeedDayGroup] = Field(default_factory=list)
    next_cursor: Optional[str] = None
