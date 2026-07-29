from fastapi import APIRouter, Depends, Query, Body, HTTPException, status
from typing import List, Optional, Union, Dict, Any
from pydantic import ValidationError
import json

from schemas.workout_schema import (
    WorkoutCreate,
    WorkoutUpdate,
    WorkoutResponse,
    WorkoutCreateLegacy,
    WorkoutRead,
    WorkoutUpdateStatus,
)
from services.auth_service import get_current_user
from services import workout_service

router = APIRouter(prefix="/workouts", tags=["Workouts"])


@router.post("/", response_model=Union[WorkoutResponse, dict])
async def create_workout(
    payload: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_user)
):
    if "athlete_id" in payload and "exercises" in payload:
        try:
            legacy_data = WorkoutCreateLegacy(**payload)
        except ValidationError as ve:
            raise HTTPException(status_code=422, detail=json.loads(ve.json()))
        return await workout_service.create_workout(legacy_data, current_user)
    
    try:
        workout_data = WorkoutCreate(**payload)
    except ValidationError as ve:
        raise HTTPException(status_code=422, detail=json.loads(ve.json()))

    return await workout_service.create_workout_template(workout_data, current_user)


@router.get("", response_model=List[WorkoutResponse])
@router.get("/", response_model=List[WorkoutResponse], include_in_schema=False)
async def get_workouts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    sport: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    return await workout_service.get_workout_templates(
        skip=skip,
        limit=limit,
        sport=sport,
        category=category,
        difficulty=difficulty,
        search=search,
        current_user=current_user,
    )


@router.get("/coach/{coach_id}", response_model=List[WorkoutRead])
async def get_coach_workouts(
    coach_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    return await workout_service.get_coach_workouts(coach_id, current_user, skip=skip, limit=limit, status=status)


@router.get("/athlete/{athlete_id}", response_model=List[WorkoutRead])
async def get_athlete_workouts(
    athlete_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    return await workout_service.get_athlete_workouts(athlete_id, current_user, skip=skip, limit=limit, status=status)


@router.put("/{workout_id}/status", response_model=dict)
async def update_workout_status(
    workout_id: str,
    status_update: WorkoutUpdateStatus,
    current_user: dict = Depends(get_current_user)
):
    return await workout_service.update_workout_status(workout_id, status_update, current_user)


@router.get("/{id}", response_model=WorkoutResponse)
async def get_workout_by_id(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    return await workout_service.get_workout_template_by_id(id, current_user)


@router.put("/{id}", response_model=WorkoutResponse)
async def update_workout(
    id: str,
    update_data: WorkoutUpdate,
    current_user: dict = Depends(get_current_user)
):
    return await workout_service.update_workout_template(id, update_data, current_user)


@router.delete("/{id}", response_model=dict)
async def delete_workout(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    return await workout_service.delete_workout_template(id, current_user)
