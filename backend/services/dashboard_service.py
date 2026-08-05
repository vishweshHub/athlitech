from database.mongodb import (
    users_collection,
    roles_collection,
    athletes_collection,
    workouts_collection,
    performance_collection,
    organizations_collection,
    memberships_collection,
)
from schemas.dashboard_schema import AdminSummaryRead, CoachSummaryRead, AthleteSummaryRead
from typing import Optional

async def get_admin_summary(user_id: Optional[str] = None) -> AdminSummaryRead:
    if not user_id:
        return AdminSummaryRead(
            total_users=0, total_coaches=0, total_athletes=0, total_roles=0, total_workouts=0, total_performances=0
        )

    org = await organizations_collection.find_one({"owner_account_id": user_id})
    if not org:
        mem = await memberships_collection.find_one({"account_id": user_id, "status": "active"})
        if mem and mem.get("organization_id"):
            org = await organizations_collection.find_one({"organization_id": mem["organization_id"]})

    if not org:
        return AdminSummaryRead(
            total_users=0, total_coaches=0, total_athletes=0, total_roles=0, total_workouts=0, total_performances=0
        )

    org_id = org.get("organization_id") or str(org.get("_id"))
    org_mems = await memberships_collection.find({"organization_id": org_id, "status": "active"}).to_list(1000)
    member_account_ids = [m["account_id"] for m in org_mems if m.get("account_id")]

    total_users = len(member_account_ids)
    total_coaches = sum(1 for m in org_mems if m.get("role") in ["coach", "coaches"])
    total_athletes = sum(1 for m in org_mems if m.get("role") in ["athlete", "athletes"])
    total_roles = len(set(m.get("role") for m in org_mems if m.get("role")))

    total_workouts = await workouts_collection.count_documents({"organization_id": org_id})
    if total_workouts == 0 and member_account_ids:
        total_workouts = await workouts_collection.count_documents({"coach_id": {"$in": member_account_ids}})

    total_performances = await performance_collection.count_documents({"organization_id": org_id})
    if total_performances == 0 and member_account_ids:
        total_performances = await performance_collection.count_documents({"athlete_id": {"$in": member_account_ids}})

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
