from fastapi import HTTPException
from bson.objectid import ObjectId
from typing import List, Optional
from datetime import datetime

import uuid
from core.permissions import normalize_role
from core.utils import get_utc_now
from repositories.workout_repository import workout_repository
from repositories.coach_repository import coach_repository
from repositories.athlete_repository import athlete_repository
from repositories.profile_repository import profile_repository
from repositories.workout_session_repository import workout_session_repository
from repositories.performance_log_repository import performance_log_repository
from services.performance_log_service import create_performance_log
from schemas.performance_log_schema import PerformanceLogCreate
from models.workout_model import Workout
from schemas.workout_schema import (
    WorkoutCreate,
    WorkoutUpdate,
    WorkoutResponse,
    WorkoutCreateLegacy,
    WorkoutRead,
    WorkoutUpdateStatus,
)


def _format_workout_response(w: dict) -> WorkoutResponse:
    workout_id = w.get("id") or w.get("workout_id") or str(w.get("_id", ""))
    return WorkoutResponse(
        id=str(workout_id),
        workout_id=str(workout_id),
        title=w.get("title", ""),
        description=w.get("description"),
        sport=w.get("sport", "General"),
        category=w.get("category", "General"),
        difficulty=w.get("difficulty", "Beginner"),
        duration_minutes=int(w.get("duration_minutes") or 0),
        equipment=w.get("equipment") or [],
        instructions=w.get("instructions"),
        created_by=w.get("created_by") or "system",
        created_by_role=w.get("created_by_role") or "admin",
        is_public=bool(w.get("is_public", True)),
        created_at=w.get("created_at") if isinstance(w.get("created_at"), datetime) else get_utc_now(),
        updated_at=w.get("updated_at") if isinstance(w.get("updated_at"), datetime) else get_utc_now(),
    )


# Workout Library Template Service Functions

async def create_workout_template(workout_data: WorkoutCreate, current_user: dict) -> WorkoutResponse:
    role = normalize_role(current_user.get("role"))
    if role not in {"admin", "coach"}:
        raise HTTPException(
            status_code=403,
            detail="Only coaches or admins can create workout templates"
        )

    new_workout = Workout(
        title=workout_data.title,
        description=workout_data.description,
        sport=workout_data.sport,
        category=workout_data.category,
        difficulty=workout_data.difficulty.value,
        duration_minutes=workout_data.duration_minutes,
        equipment=workout_data.equipment or [],
        instructions=workout_data.instructions,
        created_by=current_user.get("id"),
        created_by_role=role,
        is_public=workout_data.is_public,
        created_at=get_utc_now(),
        updated_at=get_utc_now(),
    )


    created_doc = await workout_repository.create_template(new_workout.model_dump())
    return _format_workout_response(created_doc)


async def get_workout_templates(
    skip: int = 0,
    limit: int = 100,
    sport: Optional[str] = None,
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Optional[dict] = None,
) -> List[WorkoutResponse]:
    templates = await workout_repository.get_templates(
        skip=skip,
        limit=limit,
        sport=sport,
        category=category,
        difficulty=difficulty,
        search=search,
    )

    return [_format_workout_response(w) for w in templates]


async def get_workout_template_by_id(workout_id: str, current_user: Optional[dict] = None) -> WorkoutResponse:
    workout = await workout_repository.find_template_by_id(workout_id)
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    return _format_workout_response(workout)


async def update_workout_template(workout_id: str, update_data: WorkoutUpdate, current_user: dict) -> WorkoutResponse:
    role = normalize_role(current_user.get("role"))
    if role not in ["admin", "coach"]:
        raise HTTPException(status_code=403, detail="Athletes do not have permission to update workouts")

    existing_workout = await workout_repository.find_template_by_id(workout_id)
    if not existing_workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    if role == "coach":
        created_by = str(existing_workout.get("created_by") or existing_workout.get("coach_id", ""))
        if created_by != current_user.get("id"):
            raise HTTPException(status_code=403, detail="Coaches can only update workouts created by themselves")

    changes = update_data.model_dump(exclude_unset=True)
    if not changes:
        return _format_workout_response(existing_workout)

    if "difficulty" in changes and changes["difficulty"] is not None:
        changes["difficulty"] = changes["difficulty"].value

    changes["updated_at"] = get_utc_now()

    updated_doc = await workout_repository.update_template(workout_id, changes)
    if not updated_doc:
        raise HTTPException(status_code=404, detail="Workout not found")

    return _format_workout_response(updated_doc)


async def delete_workout_template(workout_id: str, current_user: dict) -> dict:
    role = normalize_role(current_user.get("role"))
    if role not in ["admin", "coach"]:
        raise HTTPException(status_code=403, detail="Athletes do not have permission to delete workouts")

    existing_workout = await workout_repository.find_template_by_id(workout_id)
    if not existing_workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    if role == "coach":
        created_by = str(existing_workout.get("created_by") or existing_workout.get("coach_id", ""))
        if created_by != current_user.get("id"):
            raise HTTPException(status_code=403, detail="Coaches can only delete workouts created by themselves")

    deleted = await workout_repository.delete_template(workout_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Workout not found")

    return {"message": "Workout deleted successfully", "id": workout_id}


# Legacy Service Functions (for backward compatibility)

async def create_workout(workout_data: WorkoutCreateLegacy, current_user: dict):
    active_roles = current_user.get("active_roles", set())
    is_coach = "coach" in active_roles or current_user.get("role") in ["coach", "admin"]
    if not is_coach:
        raise HTTPException(status_code=403, detail="Only coaches or admins can assign workouts")

    user_id = current_user.get("id")
    coach_id = user_id

    from database.mongodb import users_collection
    user_doc = await users_collection.find_one({"email": current_user.get("email")})
    if user_doc:
        coach_id = user_doc.get("coach_id") or str(user_doc["_id"])

    if "admin" not in active_roles and current_user.get("role") != "admin":
        athlete = await athlete_repository.find_by_id(workout_data.athlete_id)
        if athlete and athlete.get("coach_id"):
            ath_coach = athlete.get("coach_id")
            if ath_coach != coach_id and ath_coach != user_id:
                raise HTTPException(status_code=403, detail="Athlete is not assigned to this coach")

    new_workout = {
        "workout_id": str(uuid.uuid4()),
        "workout_template_id": workout_data.workout_template_id,
        "title": workout_data.title,
        "description": workout_data.description,
        "coach_id": coach_id,
        "athlete_id": workout_data.athlete_id,
        "exercises": [dict(ex) for ex in workout_data.exercises],
        "date": workout_data.date,
        "status": workout_data.status or "pending",
        "created_at": get_utc_now(),
        "updated_at": get_utc_now(),
    }

    created_doc = await workout_repository.create(new_workout)
    return {"message": "Workout assigned successfully", "workout_id": created_doc.get("workout_id") or str(created_doc.get("_id", ""))}


async def get_coach_workouts(
    coach_id: str, current_user: dict, skip: int = 0, limit: int = 100, status: str | None = None
) -> List[WorkoutRead]:
    active_roles = current_user.get("active_roles", set())
    from database.mongodb import users_collection
    user_id = current_user.get("id")
    user_doc = await users_collection.find_one({"email": current_user.get("email")})
    user_coach_id = user_doc.get("coach_id") if user_doc else None

    coach_doc = await coach_repository.find_by_id(user_id) if user_id else None
    repo_coach_id = coach_doc.get("coach_id") if coach_doc else None

    allowed_ids = {user_id, user_coach_id, repo_coach_id}
    allowed_ids.discard(None)

    if "admin" not in active_roles and current_user.get("role") != "admin":
        if "coach" not in active_roles and current_user.get("role") != "coach":
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        if coach_id not in allowed_ids:
            raise HTTPException(status_code=403, detail="Coaches can only view their own workouts")

    coach_ids_to_query = list(allowed_ids | {coach_id})
    workouts = await workout_repository.get_by_coach(coach_ids_to_query, skip=skip, limit=limit, status=status)

    from database import mongodb
    users_coll = getattr(mongodb, "users_collection", None)

    valid_workouts = []
    if users_coll is not None:
        ath_ids = list({w.get("athlete_id") for w in workouts if w.get("athlete_id")})
        user_map = {}
        for ath_id in ath_ids:
            u = None
            if ObjectId.is_valid(ath_id):
                u = await users_coll.find_one({"_id": ObjectId(ath_id)})
            if not u:
                u = await users_coll.find_one({"_id": ath_id})
            if u:
                user_map[ath_id] = u
        
        for w in workouts:
            ath_id = w.get("athlete_id")
            if not ath_ids or ath_id in user_map or not user_map:
                valid_workouts.append(w)
    else:
        valid_workouts = workouts

    return [
        WorkoutRead(
            workout_id=w.get("workout_id") or w.get("id"),
            workout_template_id=w.get("workout_template_id"),
            title=w.get("title"),
            description=w.get("description"),
            coach_id=w.get("coach_id"),
            athlete_id=w.get("athlete_id"),
            exercises=w.get("exercises") or [],
            date=w.get("date") or "",
            status=w.get("status") or "pending",
            completed_at=w.get("completed_at"),
            completion_percentage=w.get("completion_percentage"),
            athlete_notes=w.get("athlete_notes"),
            created_at=w.get("created_at") if isinstance(w.get("created_at"), datetime) else get_utc_now()
        )
        for w in valid_workouts
    ]


async def get_athlete_workouts(
    athlete_id: str, current_user: dict, skip: int = 0, limit: int = 100, status: str | None = None
) -> List[WorkoutRead]:
    active_roles = current_user.get("active_roles", set())
    user_role = normalize_role(current_user.get("role", "athlete"))
    user_id = str(current_user.get("id"))
    account_id = str(current_user.get("account_id") or user_id)

    is_self = (athlete_id == user_id or athlete_id == account_id)

    if ("athlete" in active_roles or user_role == "athlete") and is_self:
        pass
    elif "admin" in active_roles or user_role == "admin":
        pass
    elif "coach" in active_roles or user_role == "coach":
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        coach = await coach_repository.find_by_id(user_id)
        if not coach:
            raise HTTPException(status_code=404, detail="Coach not found")
        coach_id = coach.get("coach_id") or str(coach["_id"])
        athlete = await athlete_repository.find_by_id(athlete_id)
        if not athlete or athlete.get("coach_id") != coach_id:
            raise HTTPException(status_code=403, detail="Coaches can only view workouts for their assigned athletes")
    elif "athlete" in active_roles or user_role == "athlete":
        if not is_self:
            raise HTTPException(status_code=403, detail="Athletes can only view their own workouts")
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    workouts = await workout_repository.get_by_athlete(athlete_id, skip=skip, limit=limit, status=status)
    return [
        WorkoutRead(
            workout_id=w.get("workout_id") or w.get("id"),
            workout_template_id=w.get("workout_template_id"),
            title=w.get("title"),
            description=w.get("description"),
            coach_id=w.get("coach_id"),
            athlete_id=w.get("athlete_id"),
            exercises=w.get("exercises") or [],
            date=w.get("date") or "",
            status=w.get("status") or "pending",
            completed_at=w.get("completed_at"),
            completion_percentage=w.get("completion_percentage"),
            athlete_notes=w.get("athlete_notes"),
            created_at=w.get("created_at") if isinstance(w.get("created_at"), datetime) else get_utc_now()
        )
        for w in workouts
    ]


async def get_workout_metadata() -> dict:
    distinct_sports = await workout_repository.get_distinct_sports()
    distinct_cats = await workout_repository.get_distinct_categories()
    distinct_diffs = await workout_repository.get_distinct_difficulties()
    distinct_eq = await workout_repository.get_distinct_equipment()

    DEFAULT_SPORTS = ["Track & Field", "Football", "Basketball", "Cricket", "General Fitness"]
    DEFAULT_CATEGORIES = ["Speed", "Endurance", "Strength", "Technique", "Mobility", "Recovery"]
    DEFAULT_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"]
    DEFAULT_EQUIPMENT = ["Starting Blocks", "Spikes", "Stopwatch", "Agility Cones", "Foam Roller", "Barbell", "Dumbbells"]

    sports = sorted(list(set(distinct_sports + DEFAULT_SPORTS)))
    categories = sorted(list(set(distinct_cats + DEFAULT_CATEGORIES)))
    difficulties = ["Beginner", "Intermediate", "Advanced"]
    equipment = sorted(list(set(distinct_eq + DEFAULT_EQUIPMENT)))

    return {
        "sports": sports,
        "categories": categories,
        "difficulties": difficulties,
        "equipment": equipment,
    }


async def update_workout_status(workout_id: str, status_update: WorkoutUpdateStatus, current_user: dict):
    if current_user.get("role") != "athlete":
        raise HTTPException(status_code=403, detail="Only athletes can update workout status")

    workout = await workout_repository.find_by_workout_id(workout_id)
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    if workout.get("athlete_id") != current_user.get("id"):
        raise HTTPException(status_code=403, detail="Athletes can only update the status of their own workouts")

    # STATUS LOCKING GATE: Completed or Skipped workouts cannot be edited or reverted.
    current_status = workout.get("status")
    if current_status in ["completed", "skipped"]:
        raise HTTPException(
            status_code=400,
            detail=f"Workout is already {current_status} and cannot be modified."
        )

    await workout_repository.update_status(
        workout_id,
        status_update.status,
        completed_at=status_update.completed_at,
        completion_percentage=status_update.completion_percentage,
        athlete_notes=status_update.athlete_notes
    )

    if status_update.status == "completed":
        ws_id = f"assigned_{workout_id}"
        ws = await workout_session_repository.find_workout_session_by_id(ws_id)
        if not ws:
            now = get_utc_now()
            athlete_id = str(current_user.get("id"))
            session_doc = {
                "id": ws_id,
                "athlete_id": athlete_id,
                "workout_template_id": workout.get("workout_template_id"),
                "source_type": "COACH_PLAN",
                "status": "completed",
                "completed_at": status_update.completed_at or now,
                "total_duration_seconds": 1800,
                "created_at": now,
                "updated_at": now,
            }
            await workout_session_repository.create_workout_session(session_doc)

        existing_log = await performance_log_repository.find_log_by_session_id(ws_id)
        if not existing_log:
            workout_name = str(workout.get("title") or workout.get("name") or "Coach Plan Workout")
            log_payload = PerformanceLogCreate(
                workout_session_id=ws_id,
                workout_template_id=workout.get("workout_template_id"),
                source_type="COACH_PLAN",
                workout_name=workout_name,
                activity_label=workout_name,
                duration_minutes=30,
                perceived_effort=5,
                completion_rating=5,
                notes=status_update.athlete_notes,
            )
            await create_performance_log(log_payload, current_user)

    return {
        "message": "Workout status updated successfully",
        "workout_id": workout_id,
        "status": status_update.status,
        "completed_at": status_update.completed_at,
        "completion_percentage": status_update.completion_percentage,
        "athlete_notes": status_update.athlete_notes
    }
