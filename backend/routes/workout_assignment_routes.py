from fastapi import APIRouter, Depends
from typing import List

from services.auth_service import get_current_user
from schemas.workout_assignment_schema import (
    WorkoutAssignmentCreate,
    WorkoutAssignmentUpdate,
    WorkoutAssignmentResponse,
)
from services.workout_assignment_service import (
    create_assignment,
    get_assignments_for_session,
    get_assignment_by_id,
    update_assignment,
    delete_assignment,
)

router = APIRouter(prefix="/training-plans", tags=["Workout Assignments"])


@router.post("/assignments/", response_model=WorkoutAssignmentResponse, summary="Create Workout Assignment")
async def create_assignment_route(
    payload: WorkoutAssignmentCreate,
    current_user: dict = Depends(get_current_user),
):
    return await create_assignment(payload, current_user)


@router.get("/sessions/{session_id}/assignments", response_model=List[WorkoutAssignmentResponse], summary="Get Assignments for Session")
async def get_session_assignments_route(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await get_assignments_for_session(session_id, current_user)


@router.get("/assignments/{assignment_id}", response_model=WorkoutAssignmentResponse, summary="Get Assignment by ID")
async def get_assignment_by_id_route(
    assignment_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await get_assignment_by_id(assignment_id, current_user)


@router.put("/assignments/{assignment_id}", response_model=WorkoutAssignmentResponse, summary="Update Workout Assignment")
async def update_assignment_route(
    assignment_id: str,
    payload: WorkoutAssignmentUpdate,
    current_user: dict = Depends(get_current_user),
):
    return await update_assignment(assignment_id, payload, current_user)


@router.delete("/assignments/{assignment_id}", summary="Delete Workout Assignment")
async def delete_assignment_route(
    assignment_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await delete_assignment(assignment_id, current_user)
