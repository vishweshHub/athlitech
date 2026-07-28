from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional

from services.auth_service import get_current_user
from schemas.athlete_saved_workout_schema import (
    AthleteSavedWorkoutCreate,
    AthleteSavedWorkoutResponse,
)
from services.athlete_saved_workout_service import (
    save_workout_for_athlete,
    get_saved_workouts_for_athlete,
    remove_saved_workout_for_athlete,
)

router = APIRouter(prefix="/athletes/me/saved-workouts", tags=["Athlete Saved Workouts"])


@router.post("", response_model=AthleteSavedWorkoutResponse, status_code=status.HTTP_201_CREATED, summary="Save Workout Template to Athlete Collection")
async def save_workout_route(
    payload: AthleteSavedWorkoutCreate,
    current_user: dict = Depends(get_current_user),
):
    return await save_workout_for_athlete(payload, current_user)


@router.get("", response_model=List[AthleteSavedWorkoutResponse], summary="Get Athlete Saved Workouts Collection")
async def get_saved_workouts_route(
    athlete_id: Optional[str] = Query(None, description="Target athlete ID (for Admin)"),
    current_user: dict = Depends(get_current_user),
):
    return await get_saved_workouts_for_athlete(current_user=current_user, target_athlete_id=athlete_id)


@router.delete("/{workout_template_id}", summary="Remove Workout Template from Athlete Collection")
async def remove_saved_workout_route(
    workout_template_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await remove_saved_workout_for_athlete(workout_template_id, current_user)
