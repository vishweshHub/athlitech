from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class TemplateInfoResponse(BaseModel):
    id: str
    title: str
    sport: str
    category: str
    difficulty: str
    duration_minutes: Optional[int] = None
    equipment: Optional[List[str]] = []
    instructions: Optional[str] = None


class TodayAssignmentResponse(BaseModel):
    id: str
    workout_template_id: str
    category: str
    order: int
    assignment_note: Optional[str] = None
    overrides: Optional[Dict[str, Any]] = None
    workout_template: Optional[TemplateInfoResponse] = None


class TodaySessionResponse(BaseModel):
    id: str
    session_name: str
    order: int
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    assignments: List[TodayAssignmentResponse] = []


class TodayDaySummary(BaseModel):
    id: str
    date: str
    day_name: str
    day_type: str
    notes: Optional[str] = None


class TodayWeekSummary(BaseModel):
    id: str
    week_number: int
    phase_tag: str
    title: str


class TodayPlanSummary(BaseModel):
    id: str
    title: str
    goal: str
    status: str


class TodayTrainingResponse(BaseModel):
    has_training: bool
    status: str = "NOT_STARTED"
    message: Optional[str] = None
    training_plan: Optional[TodayPlanSummary] = None
    training_week: Optional[TodayWeekSummary] = None
    training_day: Optional[TodayDaySummary] = None
    sessions: List[TodaySessionResponse] = []
