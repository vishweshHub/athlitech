from fastapi import APIRouter, Depends, HTTPException, Body
from services.auth_service import get_current_user
from schemas.profile_schema import (
    CompleteAthleteProfileRequest,
    CompleteCoachProfileRequest,
    ProfileResponse,
    RecommendationItem,
)
from services.profile_service import (
    complete_athlete_profile,
    complete_coach_profile,
    get_user_profile,
    get_workout_recommendations,
)
from typing import List, Dict, Any

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.post("/complete")
async def complete_profile(
    payload: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    role = current_user["role"]

    if role == "athlete":
        req = CompleteAthleteProfileRequest(**payload)
        return await complete_athlete_profile(user_id, req)
    elif role == "coach":
        req = CompleteCoachProfileRequest(**payload)
        return await complete_coach_profile(user_id, req)
    else:
        # If admin or other role
        req = CompleteAthleteProfileRequest(**payload)
        return await complete_athlete_profile(user_id, req)


@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    return await get_user_profile(user_id)


@router.get("/recommendations", response_model=List[RecommendationItem])
async def get_recommendations(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    return await get_workout_recommendations(user_id)
