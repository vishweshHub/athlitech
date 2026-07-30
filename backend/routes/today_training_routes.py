from fastapi import APIRouter, Depends, Query
from typing import Optional

from services.auth_service import get_current_user
from schemas.today_training_schema import TodayTrainingResponse
from services.today_training_service import get_today_training

router = APIRouter(prefix="/training", tags=["Today's Training"])


@router.get("/today", response_model=TodayTrainingResponse, summary="Get Today's Training Schedule")
async def get_today_training_route(
    athlete_id: Optional[str] = Query(None, description="Target athlete ID (for Coaches and Admins)"),
    target_date: Optional[str] = Query(None, description="Override date in YYYY-MM-DD format (defaults to today)"),
    current_user: dict = Depends(get_current_user),
):
    return await get_today_training(current_user=current_user, athlete_id=athlete_id, target_date=target_date)
