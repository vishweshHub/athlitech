from fastapi import APIRouter, Depends, Query
from typing import List

from schemas.workout_schema import WorkoutCreate, WorkoutRead, WorkoutUpdateStatus
from services.auth_service import get_current_user, require_admin
from services import workout_service

router = APIRouter(prefix="/workouts", tags=["Workouts"])

@router.post("/", response_model=dict)
async def create_workout(workout_data: WorkoutCreate, current_user: dict = Depends(get_current_user)):
    return await workout_service.create_workout(workout_data, current_user)

@router.get("/coach/{coach_id}", response_model=List[WorkoutRead])
async def get_coach_workouts(
    coach_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: str | None = Query(None),
    current_user: dict = Depends(get_current_user)
):
    return await workout_service.get_coach_workouts(coach_id, current_user, skip=skip, limit=limit, status=status)

@router.get("/athlete/{athlete_id}", response_model=List[WorkoutRead])
async def get_athlete_workouts(
    athlete_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: str | None = Query(None),
    current_user: dict = Depends(get_current_user)
):
    return await workout_service.get_athlete_workouts(athlete_id, current_user, skip=skip, limit=limit, status=status)

@router.put("/{workout_id}/status", response_model=dict)
async def update_workout_status(workout_id: str, status_update: WorkoutUpdateStatus, current_user: dict = Depends(get_current_user)):
    return await workout_service.update_workout_status(workout_id, status_update, current_user)

@router.get("/", response_model=List[WorkoutRead], dependencies=[Depends(require_admin)])
async def get_all_workouts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: str | None = Query(None),
    search: str | None = Query(None),
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]

    workouts = []
    from repositories.workout_repository import workout_repository
    async for w in workout_repository.collection.find(query).skip(skip).limit(limit):
        workouts.append(w)

    from database.mongodb import users_collection
    from bson.objectid import ObjectId
    
    ath_ids = list({w.get("athlete_id") for w in workouts if w.get("athlete_id")})
    object_ids = [ObjectId(uid) for uid in ath_ids if ObjectId.is_valid(uid)]
    string_ids = [uid for uid in ath_ids if not ObjectId.is_valid(uid)]
    
    user_query = {"$or": []}
    if object_ids:
        user_query["$or"].append({"_id": {"$in": object_ids}})
    if string_ids:
        user_query["$or"].append({"_id": {"$in": string_ids}})

    user_map = {}
    if user_query["$or"]:
        async for u in users_collection.find(user_query):
            user_map[str(u["_id"])] = u

    valid_workouts = []
    for w in workouts:
        ath_id = w.get("athlete_id")
        if ath_id in user_map:
            valid_workouts.append(w)

    return [
        WorkoutRead(
            workout_id=w.get("workout_id"),
            title=w.get("title"),
            description=w.get("description"),
            coach_id=w.get("coach_id"),
            athlete_id=w.get("athlete_id"),
            exercises=w.get("exercises"),
            date=w.get("date"),
            status=w.get("status"),
            completed_at=w.get("completed_at"),
            completion_percentage=w.get("completion_percentage"),
            athlete_notes=w.get("athlete_notes"),
            created_at=w.get("created_at")
        )
        for w in valid_workouts
    ]

