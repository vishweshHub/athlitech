from pydantic import BaseModel

class AdminSummaryRead(BaseModel):
    total_users: int
    total_coaches: int
    total_athletes: int
    total_roles: int
    total_workouts: int
    total_performances: int

class CoachSummaryRead(BaseModel):
    total_assigned_athletes: int
    total_workouts_assigned: int
    completed_workouts: int
    pending_workouts: int
    total_performance_records: int

class AthleteSummaryRead(BaseModel):
    total_workouts: int
    completed_workouts: int
    pending_workouts: int
    skipped_workouts: int
    completion_rate: int
