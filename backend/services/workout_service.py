from fastapi import HTTPException
from bson.objectid import ObjectId
from typing import List, Optional
from datetime import datetime

from core.permissions import normalize_role
from repositories.workout_repository import workout_repository
from repositories.coach_repository import coach_repository
from repositories.athlete_repository import athlete_repository
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
        title=w.get("title", ""),
        description=w.get("description"),
        sport=w.get("sport", "General"),
        category=w.get("category", "General"),
        difficulty=w.get("difficulty", "Beginner"),
        duration_minutes=w.get("duration_minutes", 30),
        equipment=w.get("equipment") or [],
        instructions=w.get("instructions"),
        created_by=str(w.get("created_by") or w.get("coach_id", "")),
        created_by_role=str(w.get("created_by_role", "coach")),
        is_public=w.get("is_public", True),
        created_at=w.get("created_at") if isinstance(w.get("created_at"), datetime) else datetime.utcnow(),
        updated_at=w.get("updated_at") if isinstance(w.get("updated_at"), datetime) else datetime.utcnow(),
    )


# Workout Library Template Service Functions

async def create_workout_template(workout_data: WorkoutCreate, current_user: dict) -> WorkoutResponse:
    role = normalize_role(current_user.get("role"))
    if role not in ["admin", "coach"]:
        raise HTTPException(status_code=403, detail="Athletes do not have permission to create workouts")


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
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    created_doc = await workout_repository.create_template(new_workout.dict())
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

    changes["updated_at"] = datetime.utcnow()

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
    if current_user.get("role") != "coach":
        raise HTTPException(status_code=403, detail="Only coaches can create workouts")

    if not ObjectId.is_valid(current_user.get("id")):
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    coach = await coach_repository.find_by_id(current_user.get("id"))
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")

    coach_id = coach.get("coach_id") or str(coach["_id"])

    athlete = await athlete_repository.find_by_id(workout_data.athlete_id)
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    if athlete.get("coach_id") != coach_id:
        raise HTTPException(status_code=403, detail="Athlete is not assigned to this coach")

    new_workout = Workout(
        title=workout_data.title,
        description=workout_data.description,
        coach_id=coach_id,
        athlete_id=workout_data.athlete_id,
        exercises=[dict(ex) for ex in workout_data.exercises],
        date=workout_data.date,
        status=workout_data.status
    )

    await workout_repository.create(new_workout.dict())
    return {"message": "Workout plan created successfully", "workout_id": new_workout.workout_id or new_workout.id}


async def get_coach_workouts(
    coach_id: str, current_user: dict, skip: int = 0, limit: int = 100, status: str | None = None
) -> List[WorkoutRead]:
    if current_user.get("role") == "coach":
        if not ObjectId.is_valid(current_user.get("id")):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        coach = await coach_repository.find_by_id(current_user.get("id"))
        user_coach_id = coach.get("coach_id") or str(coach["_id"]) if coach else None
        if not coach or user_coach_id != coach_id:
            raise HTTPException(status_code=403, detail="Coaches can only view their own workouts")
    elif current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    workouts = await workout_repository.get_by_coach(coach_id, skip=skip, limit=limit, status=status)

    from database import mongodb
    users_coll = getattr(mongodb, "users_collection", None)

    valid_workouts = []
    if users_coll:
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
            created_at=w.get("created_at") if isinstance(w.get("created_at"), datetime) else datetime.utcnow()
        )
        for w in valid_workouts
    ]


async def get_athlete_workouts(
    athlete_id: str, current_user: dict, skip: int = 0, limit: int = 100, status: str | None = None
) -> List[WorkoutRead]:
    if current_user.get("role") == "athlete":
        if current_user.get("id") != athlete_id:
            raise HTTPException(status_code=403, detail="Athletes can only view their own workouts")
    elif current_user.get("role") == "coach":
        if not ObjectId.is_valid(current_user.get("id")):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        coach = await coach_repository.find_by_id(current_user.get("id"))
        if not coach:
            raise HTTPException(status_code=404, detail="Coach not found")
        coach_id = coach.get("coach_id") or str(coach["_id"])
        athlete = await athlete_repository.find_by_id(athlete_id)
        if not athlete or athlete.get("coach_id") != coach_id:
            raise HTTPException(status_code=403, detail="Coaches can only view workouts for their assigned athletes")
    elif current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    workouts = await workout_repository.get_by_athlete(athlete_id, skip=skip, limit=limit, status=status)
    return [
        WorkoutRead(
            workout_id=w.get("workout_id") or w.get("id"),
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
            created_at=w.get("created_at") if isinstance(w.get("created_at"), datetime) else datetime.utcnow()
        )
        for w in workouts
    ]


async def update_workout_status(workout_id: str, status_update: WorkoutUpdateStatus, current_user: dict):
    if current_user.get("role") != "athlete":
        raise HTTPException(status_code=403, detail="Only athletes can update workout status")

    workout = await workout_repository.find_by_workout_id(workout_id)
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    if workout.get("athlete_id") != current_user.get("id"):
        raise HTTPException(status_code=403, detail="Athletes can only update the status of their own workouts")

    await workout_repository.update_status(
        workout_id,
        status_update.status,
        completed_at=status_update.completed_at,
        completion_percentage=status_update.completion_percentage,
        athlete_notes=status_update.athlete_notes
    )
    return {
        "message": "Workout status updated successfully",
        "workout_id": workout_id,
        "status": status_update.status,
        "completed_at": status_update.completed_at,
        "completion_percentage": status_update.completion_percentage,
        "athlete_notes": status_update.athlete_notes
    }
