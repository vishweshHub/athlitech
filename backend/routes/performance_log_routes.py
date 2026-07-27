from fastapi import APIRouter, Depends, Query
from typing import List, Optional

from services.auth_service import get_current_user
from schemas.performance_log_schema import (
    PerformanceLogCreate,
    PerformanceLogResponse,
)
from services.performance_log_service import (
    create_performance_log,
    get_performance_log_by_id,
    get_logs_for_workout_session,
    get_logs_for_athlete,
)

router = APIRouter(prefix="/performance-logs", tags=["Performance Logs"])


@router.post("", response_model=PerformanceLogResponse, summary="Create Performance Log")
@router.post("/", response_model=PerformanceLogResponse, summary="Create Performance Log")
async def create_performance_log_route(
    payload: PerformanceLogCreate,
    current_user: dict = Depends(get_current_user),
):
    return await create_performance_log(payload, current_user)


@router.get("/workout-session/{workout_session_id}", response_model=List[PerformanceLogResponse], summary="Get Logs for Workout Session")
async def get_workout_session_logs_route(
    workout_session_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await get_logs_for_workout_session(workout_session_id, current_user)


@router.get("/athlete/{athlete_id}", response_model=List[PerformanceLogResponse], summary="Get Athlete Performance Logs (Paginated)")
async def get_athlete_logs_route(
    athlete_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    return await get_logs_for_athlete(athlete_id=athlete_id, skip=skip, limit=limit, current_user=current_user)


@router.get("/{id}", response_model=PerformanceLogResponse, summary="Get Performance Log by ID")
async def get_performance_log_by_id_route(
    id: str,
    current_user: dict = Depends(get_current_user),
):
    return await get_performance_log_by_id(id, current_user)
