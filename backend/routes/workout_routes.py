from fastapi import APIRouter, Depends
from typing import List

from schemas.workout_schema import WorkoutCreate, WorkoutRead, WorkoutUpdateStatus
from services.auth_service import get_current_user, require_admin
from services import workout_service

router = APIRouter(prefix="/workouts", tags=["Workouts"])

@router.post("/", response_model=dict)
async def create_workout(workout_data: WorkoutCreate, current_user: dict = Depends(get_current_user)):
    return await workout_service.create_workout(workout_data, current_user)

@router.get("/coach/{coach_id}", response_model=List[WorkoutRead])
async def get_coach_workouts(coach_id: str, current_user: dict = Depends(get_current_user)):
    return await workout_service.get_coach_workouts(coach_id, current_user)

@router.get("/athlete/{athlete_id}", response_model=List[WorkoutRead])
async def get_athlete_workouts(athlete_id: str, current_user: dict = Depends(get_current_user)):
    return await workout_service.get_athlete_workouts(athlete_id, current_user)

@router.put("/{workout_id}/status", response_model=dict)
async def update_workout_status(workout_id: str, status_update: WorkoutUpdateStatus, current_user: dict = Depends(get_current_user)):
    return await workout_service.update_workout_status(workout_id, status_update, current_user)

@router.get("/", response_model=List[WorkoutRead], dependencies=[Depends(require_admin)])
async def get_all_workouts(current_user: dict = Depends(get_current_user)):
    workouts = []
    from repositories.workout_repository import workout_repository
    async for w in workout_repository.collection.find():
        workouts.append(w)
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
        for w in workouts
    ]
