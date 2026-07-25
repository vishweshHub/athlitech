import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException

from core.permissions import normalize_role
from repositories.training_plan_repository import training_plan_repository
from repositories.athlete_repository import athlete_repository
from schemas.training_plan_schema import (
    TrainingPlanCreate,
    TrainingPlanUpdate,
    TrainingPlanResponse,
    TrainingWeekCreate,
    TrainingWeekUpdate,
    TrainingWeekResponse,
    TrainingDayCreate,
    TrainingDayUpdate,
    TrainingDayResponse,
)


def _format_plan_response(p: dict) -> TrainingPlanResponse:
    plan_id = str(p.get("id") or p.get("_id"))
    return TrainingPlanResponse(
        id=plan_id,
        title=p.get("title", ""),
        description=p.get("description"),
        goal=p.get("goal", ""),
        athlete_id=str(p.get("athlete_id", "")),
        created_by=str(p.get("created_by", "")),
        owner_type=str(p.get("owner_type", "self")),
        start_date=str(p.get("start_date", "")),
        end_date=str(p.get("end_date", "")),
        status=str(p.get("status", "draft")),
        created_at=p.get("created_at") if isinstance(p.get("created_at"), datetime) else datetime.utcnow(),
        updated_at=p.get("updated_at") if isinstance(p.get("updated_at"), datetime) else datetime.utcnow(),
    )


def _format_week_response(w: dict) -> TrainingWeekResponse:
    week_id = str(w.get("id") or w.get("_id"))
    return TrainingWeekResponse(
        id=week_id,
        training_plan_id=str(w.get("training_plan_id", "")),
        week_number=int(w.get("week_number", 1)),
        phase_tag=str(w.get("phase_tag", "Base")),
        title=str(w.get("title", "")),
        target_volume=w.get("target_volume"),
        target_intensity=w.get("target_intensity"),
    )


def _format_day_response(d: dict) -> TrainingDayResponse:
    day_id = str(d.get("id") or d.get("_id"))
    return TrainingDayResponse(
        id=day_id,
        training_week_id=str(d.get("training_week_id", "")),
        date=str(d.get("date", "")),
        day_name=str(d.get("day_name", "")),
        day_type=str(d.get("day_type", "Training")),
        notes=d.get("notes"),
    )


async def _verify_plan_access(plan: dict, current_user: dict, require_write: bool = False):
    role = normalize_role(current_user.get("role"))
    user_id = str(current_user.get("id"))
    if role == "admin":
        return

    athlete_id = str(plan.get("athlete_id", ""))
    created_by = str(plan.get("created_by", ""))

    if role == "athlete":
        if athlete_id != user_id and created_by != user_id:
            raise HTTPException(status_code=403, detail="Insufficient permissions for this training plan")

    elif role == "coach":
        if created_by == user_id:
            return
        # Check if athlete is assigned to coach
        ath_doc = await athlete_repository.find_by_id(athlete_id)
        if not ath_doc or str(ath_doc.get("coach_id")) != user_id:
            raise HTTPException(status_code=403, detail="Coaches can only access plans for their assigned athletes")


# --- Training Plan Service ---

async def create_training_plan(payload: TrainingPlanCreate, current_user: dict) -> TrainingPlanResponse:
    role = normalize_role(current_user.get("role"))
    user_id = str(current_user.get("id"))

    owner_type = payload.owner_type.value if payload.owner_type else "self"
    if role == "athlete":
        owner_type = "self"
        if payload.athlete_id != user_id:
            raise HTTPException(status_code=403, detail="Athletes can only create training plans for themselves")
    elif role == "coach":
        owner_type = "coach"

    plan_doc = {
        "id": str(uuid.uuid4()),
        "title": payload.title,
        "description": payload.description,
        "goal": payload.goal,
        "athlete_id": payload.athlete_id,
        "created_by": user_id,
        "owner_type": owner_type,
        "start_date": payload.start_date,
        "end_date": payload.end_date,
        "status": payload.status.value if payload.status else "draft",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    created = await training_plan_repository.create_plan(plan_doc)
    return _format_plan_response(created)


async def get_all_training_plans(
    skip: int = 0, limit: int = 100, athlete_id: Optional[str] = None, current_user: Optional[dict] = None
) -> List[TrainingPlanResponse]:
    role = normalize_role(current_user.get("role")) if current_user else "athlete"
    user_id = str(current_user.get("id")) if current_user else ""

    query_filter = {}
    if athlete_id:
        query_filter["athlete_id"] = athlete_id

    if role == "athlete":
        query_filter["$or"] = [{"athlete_id": user_id}, {"created_by": user_id}]
    elif role == "coach":
        # Get assigned athletes for this coach
        assigned_athletes = await athlete_repository.get_athletes_by_coach(user_id)
        assigned_ids = [str(a.get("athlete_id")) for a in assigned_athletes if a.get("athlete_id")]
        query_filter["$or"] = [{"created_by": user_id}, {"athlete_id": {"$in": assigned_ids}}]

    plans = await training_plan_repository.get_plans(skip=skip, limit=limit, query_filter=query_filter)
    return [_format_plan_response(p) for p in plans]


async def get_training_plan_by_id(plan_id: str, current_user: dict) -> TrainingPlanResponse:
    plan = await training_plan_repository.find_plan_by_id(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Training Plan not found")
    await _verify_plan_access(plan, current_user)
    return _format_plan_response(plan)


async def update_training_plan(plan_id: str, payload: TrainingPlanUpdate, current_user: dict) -> TrainingPlanResponse:
    plan = await training_plan_repository.find_plan_by_id(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Training Plan not found")
    await _verify_plan_access(plan, current_user, require_write=True)

    changes = {k: v.value if hasattr(v, "value") else v for k, v in payload.model_dump(exclude_unset=True).items()}
    if not changes:
        return _format_plan_response(plan)

    changes["updated_at"] = datetime.utcnow()
    updated = await training_plan_repository.update_plan(plan_id, changes)
    return _format_plan_response(updated)


async def delete_training_plan(plan_id: str, current_user: dict) -> dict:
    plan = await training_plan_repository.find_plan_by_id(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Training Plan not found")
    await _verify_plan_access(plan, current_user, require_write=True)

    deleted = await training_plan_repository.delete_plan(plan_id)
    if not deleted:
        raise HTTPException(status_code=500, detail="Failed to delete training plan")
    return {"message": "Training plan deleted successfully", "id": plan_id}


# --- Training Week Service ---

async def create_training_week(payload: TrainingWeekCreate, current_user: dict) -> TrainingWeekResponse:
    plan = await training_plan_repository.find_plan_by_id(payload.training_plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail=f"Training Plan with ID '{payload.training_plan_id}' does not exist")
    await _verify_plan_access(plan, current_user, require_write=True)

    week_doc = {
        "id": str(uuid.uuid4()),
        "training_plan_id": payload.training_plan_id,
        "week_number": payload.week_number,
        "phase_tag": payload.phase_tag.value,
        "title": payload.title,
        "target_volume": payload.target_volume,
        "target_intensity": payload.target_intensity,
    }

    created = await training_plan_repository.create_week(week_doc)
    return _format_week_response(created)


async def get_weeks_for_plan(plan_id: str, current_user: dict) -> List[TrainingWeekResponse]:
    plan = await training_plan_repository.find_plan_by_id(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Training Plan not found")
    await _verify_plan_access(plan, current_user)

    weeks = await training_plan_repository.get_weeks_by_plan(plan_id)
    return [_format_week_response(w) for w in weeks]


async def get_training_week_by_id(week_id: str, current_user: dict) -> TrainingWeekResponse:
    week = await training_plan_repository.find_week_by_id(week_id)
    if not week:
        raise HTTPException(status_code=404, detail="Training Week not found")
    plan = await training_plan_repository.find_plan_by_id(week["training_plan_id"])
    if plan:
        await _verify_plan_access(plan, current_user)

    return _format_week_response(week)


async def update_training_week(week_id: str, payload: TrainingWeekUpdate, current_user: dict) -> TrainingWeekResponse:
    week = await training_plan_repository.find_week_by_id(week_id)
    if not week:
        raise HTTPException(status_code=404, detail="Training Week not found")
    plan = await training_plan_repository.find_plan_by_id(week["training_plan_id"])
    if plan:
        await _verify_plan_access(plan, current_user, require_write=True)

    changes = {k: v.value if hasattr(v, "value") else v for k, v in payload.model_dump(exclude_unset=True).items()}
    if not changes:
        return _format_week_response(week)

    updated = await training_plan_repository.update_week(week_id, changes)
    return _format_week_response(updated)


async def delete_training_week(week_id: str, current_user: dict) -> dict:
    week = await training_plan_repository.find_week_by_id(week_id)
    if not week:
        raise HTTPException(status_code=404, detail="Training Week not found")
    plan = await training_plan_repository.find_plan_by_id(week["training_plan_id"])
    if plan:
        await _verify_plan_access(plan, current_user, require_write=True)

    deleted = await training_plan_repository.delete_week(week_id)
    if not deleted:
        raise HTTPException(status_code=500, detail="Failed to delete training week")
    return {"message": "Training week deleted successfully", "id": week_id}


# --- Training Day Service ---

async def create_training_day(payload: TrainingDayCreate, current_user: dict) -> TrainingDayResponse:
    week = await training_plan_repository.find_week_by_id(payload.training_week_id)
    if not week:
        raise HTTPException(status_code=404, detail=f"Training Week with ID '{payload.training_week_id}' does not exist")
    plan = await training_plan_repository.find_plan_by_id(week["training_plan_id"])
    if plan:
        await _verify_plan_access(plan, current_user, require_write=True)

    day_doc = {
        "id": str(uuid.uuid4()),
        "training_week_id": payload.training_week_id,
        "date": payload.date,
        "day_name": payload.day_name,
        "day_type": payload.day_type.value,
        "notes": payload.notes,
    }

    created = await training_plan_repository.create_day(day_doc)
    return _format_day_response(created)


async def get_days_for_week(week_id: str, current_user: dict) -> List[TrainingDayResponse]:
    week = await training_plan_repository.find_week_by_id(week_id)
    if not week:
        raise HTTPException(status_code=404, detail="Training Week not found")
    plan = await training_plan_repository.find_plan_by_id(week["training_plan_id"])
    if plan:
        await _verify_plan_access(plan, current_user)

    days = await training_plan_repository.get_days_by_week(week_id)
    return [_format_day_response(d) for d in days]


async def get_training_day_by_id(day_id: str, current_user: dict) -> TrainingDayResponse:
    day = await training_plan_repository.find_day_by_id(day_id)
    if not day:
        raise HTTPException(status_code=404, detail="Training Day not found")
    week = await training_plan_repository.find_week_by_id(day["training_week_id"])
    if week:
        plan = await training_plan_repository.find_plan_by_id(week["training_plan_id"])
        if plan:
            await _verify_plan_access(plan, current_user)

    return _format_day_response(day)


async def update_training_day(day_id: str, payload: TrainingDayUpdate, current_user: dict) -> TrainingDayResponse:
    day = await training_plan_repository.find_day_by_id(day_id)
    if not day:
        raise HTTPException(status_code=404, detail="Training Day not found")
    week = await training_plan_repository.find_week_by_id(day["training_week_id"])
    if week:
        plan = await training_plan_repository.find_plan_by_id(week["training_plan_id"])
        if plan:
            await _verify_plan_access(plan, current_user, require_write=True)

    changes = {k: v.value if hasattr(v, "value") else v for k, v in payload.model_dump(exclude_unset=True).items()}
    if not changes:
        return _format_day_response(day)

    updated = await training_plan_repository.update_day(day_id, changes)
    return _format_day_response(updated)


async def delete_training_day(day_id: str, current_user: dict) -> dict:
    day = await training_plan_repository.find_day_by_id(day_id)
    if not day:
        raise HTTPException(status_code=404, detail="Training Day not found")
    week = await training_plan_repository.find_week_by_id(day["training_week_id"])
    if week:
        plan = await training_plan_repository.find_plan_by_id(week["training_plan_id"])
        if plan:
            await _verify_plan_access(plan, current_user, require_write=True)

    deleted = await training_plan_repository.delete_day(day_id)
    if not deleted:
        raise HTTPException(status_code=500, detail="Failed to delete training day")
    return {"message": "Training day deleted successfully", "id": day_id}
