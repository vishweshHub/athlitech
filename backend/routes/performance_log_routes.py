from fastapi import APIRouter, Depends, Query, HTTPException
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
from core.config import DEV_MODE
from repositories.performance_log_repository import performance_log_repository
from repositories.workout_session_repository import workout_session_repository

from fastapi import APIRouter, Depends, Query, status

router = APIRouter(prefix="/performance-logs", tags=["Performance Logs"])


@router.post("", response_model=PerformanceLogResponse, status_code=status.HTTP_201_CREATED, summary="Create Performance Log")
@router.post("/", response_model=PerformanceLogResponse, status_code=status.HTTP_201_CREATED, summary="Create Performance Log")
async def create_performance_log_route(
    payload: PerformanceLogCreate,
    current_user: dict = Depends(get_current_user),
):
    return await create_performance_log(payload, current_user)


@router.get("/me", response_model=List[PerformanceLogResponse], summary="Get Current Athlete's Performance Logs")
async def get_my_performance_logs_route(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    athlete_id = str(current_user.get("id"))
    return await get_logs_for_athlete(athlete_id=athlete_id, skip=skip, limit=limit, current_user=current_user)


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


@router.delete(
    "/dev-reset/{workout_session_id}",
    summary="[DEV ONLY] Delete all performance logs for a workout session",
    status_code=status.HTTP_200_OK,
)
async def dev_reset_performance_logs(
    workout_session_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Development-only endpoint to delete performance logs for a session.
    Used to reset demo state for repeated workflow demonstrations.
    Only available when DEV_MODE=true in backend .env.
    Athletes can only reset their own session logs.
    """
    if not DEV_MODE:
        raise HTTPException(
            status_code=403,
            detail="This endpoint is only available in development mode."
        )

    role = str(current_user.get("role", "")).lower()

    # Coaches and admins are not allowed to bulk-delete athlete logs via this endpoint
    if role not in ("athlete", "admin"):
        raise HTTPException(
            status_code=403,
            detail="Only athletes can reset their own performance logs."
        )

    # Verify the session exists and belongs to this athlete
    ws = await workout_session_repository.find_workout_session_by_id(workout_session_id)
    if not ws:
        raise HTTPException(status_code=404, detail=f"Workout session '{workout_session_id}' not found.")

    athlete_id = str(current_user.get("id"))
    session_athlete_id = str(ws.get("athlete_id", ""))

    if role == "athlete" and session_athlete_id != athlete_id:
        raise HTTPException(status_code=403, detail="You can only reset your own performance logs.")

    deleted = await performance_log_repository.delete_logs_by_session_id(
        workout_session_id=workout_session_id,
        athlete_id=session_athlete_id,
    )
    return {"deleted": deleted, "workout_session_id": workout_session_id, "message": f"Deleted {deleted} performance log(s) for this session."}
