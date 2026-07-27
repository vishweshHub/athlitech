from fastapi import APIRouter, Depends, Query
from typing import Optional

from services.auth_service import get_current_user
from schemas.workout_session_schema import (
    WorkoutSessionStartRequest,
    WorkoutSessionCompleteRequest,
    WorkoutSessionCancelRequest,
    WorkoutSessionResponse,
)
from services.workout_session_service import (
    start_workout_session,
    pause_workout_session,
    resume_workout_session,
    complete_workout_session,
    cancel_workout_session,
    get_active_workout_session,
    get_workout_session_by_id,
)

router = APIRouter(prefix="/workout-sessions", tags=["Workout Sessions"])


@router.post("/start", response_model=WorkoutSessionResponse, summary="Start Workout Session")
async def start_session_route(
    payload: WorkoutSessionStartRequest,
    current_user: dict = Depends(get_current_user),
):
    return await start_workout_session(payload, current_user)


@router.post("/{id}/pause", response_model=WorkoutSessionResponse, summary="Pause Workout Session")
async def pause_session_route(
    id: str,
    current_user: dict = Depends(get_current_user),
):
    return await pause_workout_session(id, current_user)


@router.post("/{id}/resume", response_model=WorkoutSessionResponse, summary="Resume Workout Session")
async def resume_session_route(
    id: str,
    current_user: dict = Depends(get_current_user),
):
    return await resume_workout_session(id, current_user)


@router.post("/{id}/complete", response_model=WorkoutSessionResponse, summary="Complete Workout Session")
async def complete_session_route(
    id: str,
    payload: WorkoutSessionCompleteRequest,
    current_user: dict = Depends(get_current_user),
):
    return await complete_workout_session(id, payload, current_user)


@router.post("/{id}/cancel", response_model=WorkoutSessionResponse, summary="Cancel Workout Session")
async def cancel_session_route(
    id: str,
    payload: WorkoutSessionCancelRequest,
    current_user: dict = Depends(get_current_user),
):
    return await cancel_workout_session(id, payload, current_user)


@router.get("/active", response_model=WorkoutSessionResponse, summary="Get Athlete's Active Workout Session")
async def get_active_session_route(
    athlete_id: Optional[str] = Query(None, description="Target athlete ID (for Coaches and Admins)"),
    current_user: dict = Depends(get_current_user),
):
    return await get_active_workout_session(current_user=current_user, athlete_id=athlete_id)


@router.get("/{id}", response_model=WorkoutSessionResponse, summary="Get Workout Session by ID")
async def get_session_by_id_route(
    id: str,
    current_user: dict = Depends(get_current_user),
):
    return await get_workout_session_by_id(id, current_user)
