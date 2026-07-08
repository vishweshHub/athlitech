from fastapi import APIRouter, Depends
from typing import List

from schemas.workout_schema import WorkoutCreate, WorkoutRead, WorkoutUpdateStatus
from services.auth_service import get_current_user
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
