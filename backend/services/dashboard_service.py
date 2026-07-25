from database.mongodb import (
    users_collection,
    roles_collection,
    athletes_collection,
    workouts_collection,
    performance_collection,
)
from schemas.dashboard_schema import AdminSummaryRead, CoachSummaryRead, AthleteSummaryRead

async def get_admin_summary() -> AdminSummaryRead:
    total_users = await users_collection.count_documents({})
    total_coaches = await users_collection.count_documents({"role": "coach"})
    total_athletes = await users_collection.count_documents({"role": "athlete"})
    total_roles = await roles_collection.count_documents({})
    total_workouts = await workouts_collection.count_documents({})
    total_performances = await performance_collection.count_documents({})

    return AdminSummaryRead(
        total_users=total_users,
        total_coaches=total_coaches,
        total_athletes=total_athletes,
        total_roles=total_roles,
        total_workouts=total_workouts,
        total_performances=total_performances,
    )

async def get_coach_summary(coach_id: str) -> CoachSummaryRead:
    total_assigned_athletes = await athletes_collection.count_documents({"coach_id": coach_id})
    total_workouts_assigned = await workouts_collection.count_documents({"coach_id": coach_id})
    completed_workouts = await workouts_collection.count_documents({"coach_id": coach_id, "status": "completed"})
    pending_workouts = await workouts_collection.count_documents({"coach_id": coach_id, "status": "pending"})
    total_performance_records = await performance_collection.count_documents({"coach_id": coach_id})

    return CoachSummaryRead(
        total_assigned_athletes=total_assigned_athletes,
        total_workouts_assigned=total_workouts_assigned,
        completed_workouts=completed_workouts,
        pending_workouts=pending_workouts,
        total_performance_records=total_performance_records,
    )

async def get_athlete_summary(athlete_id: str) -> AthleteSummaryRead:
    total_workouts = await workouts_collection.count_documents({"athlete_id": athlete_id})
    completed_workouts = await workouts_collection.count_documents({"athlete_id": athlete_id, "status": "completed"})
    pending_workouts = await workouts_collection.count_documents({"athlete_id": athlete_id, "status": "pending"})
    skipped_workouts = await workouts_collection.count_documents({"athlete_id": athlete_id, "status": "skipped"})
    
    completion_rate = 0
    if total_workouts > 0:
        completion_rate = int(round((completed_workouts / total_workouts) * 100))

    return AthleteSummaryRead(
        total_workouts=total_workouts,
        completed_workouts=completed_workouts,
        pending_workouts=pending_workouts,
        skipped_workouts=skipped_workouts,
        completion_rate=completion_rate,
    )
