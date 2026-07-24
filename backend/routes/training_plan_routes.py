from fastapi import APIRouter, Depends, Query
from typing import List, Optional

from services.auth_service import get_current_user
from schemas.training_plan_schema import (
    TrainingPlanCreate,
    TrainingPlanUpdate,
    TrainingPlanResponse,
    TrainingWeekCreate,
    TrainingWeekUpdate,
    TrainingWeekResponse,
    TrainingDayCreate,
    TrainingDayUpdate,
    TrainingDayResponse,
)
from services.training_plan_service import (
    create_training_plan,
    get_all_training_plans,
    get_training_plan_by_id,
    update_training_plan,
    delete_training_plan,
    create_training_week,
    get_weeks_for_plan,
    get_training_week_by_id,
    update_training_week,
    delete_training_week,
    create_training_day,
    get_days_for_week,
    get_training_day_by_id,
    update_training_day,
    delete_training_day,
)

router = APIRouter(prefix="/training-plans", tags=["Training Plans"])


# --- Training Plans Endpoints ---

@router.post("/", response_model=TrainingPlanResponse, summary="Create Training Plan")
async def create_plan_route(
    payload: TrainingPlanCreate,
    current_user: dict = Depends(get_current_user),
):
    return await create_training_plan(payload, current_user)


@router.get("/", response_model=List[TrainingPlanResponse], summary="Get All Training Plans")
async def get_plans_route(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    athlete_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    return await get_all_training_plans(skip=skip, limit=limit, athlete_id=athlete_id, current_user=current_user)


@router.get("/athlete/{athlete_id}", response_model=List[TrainingPlanResponse], summary="Get Plans for Specific Athlete")
async def get_athlete_plans_route(
    athlete_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    return await get_all_training_plans(skip=skip, limit=limit, athlete_id=athlete_id, current_user=current_user)


@router.get("/{plan_id}", response_model=TrainingPlanResponse, summary="Get Training Plan by ID")
async def get_plan_by_id_route(
    plan_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await get_training_plan_by_id(plan_id, current_user)


@router.put("/{plan_id}", response_model=TrainingPlanResponse, summary="Update Training Plan")
async def update_plan_route(
    plan_id: str,
    payload: TrainingPlanUpdate,
    current_user: dict = Depends(get_current_user),
):
    return await update_training_plan(plan_id, payload, current_user)


@router.delete("/{plan_id}", summary="Delete Training Plan")
async def delete_plan_route(
    plan_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await delete_training_plan(plan_id, current_user)


# --- Training Weeks Endpoints ---

@router.post("/weeks/", response_model=TrainingWeekResponse, summary="Create Training Week")
async def create_week_route(
    payload: TrainingWeekCreate,
    current_user: dict = Depends(get_current_user),
):
    return await create_training_week(payload, current_user)


@router.get("/plans/{plan_id}/weeks", response_model=List[TrainingWeekResponse], summary="Get Weeks for a Training Plan")
async def get_plan_weeks_route(
    plan_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await get_weeks_for_plan(plan_id, current_user)


@router.get("/weeks/{week_id}", response_model=TrainingWeekResponse, summary="Get Training Week by ID")
async def get_week_by_id_route(
    week_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await get_training_week_by_id(week_id, current_user)


@router.put("/weeks/{week_id}", response_model=TrainingWeekResponse, summary="Update Training Week")
async def update_week_route(
    week_id: str,
    payload: TrainingWeekUpdate,
    current_user: dict = Depends(get_current_user),
):
    return await update_training_week(week_id, payload, current_user)


@router.delete("/weeks/{week_id}", summary="Delete Training Week")
async def delete_week_route(
    week_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await delete_training_week(week_id, current_user)


# --- Training Days Endpoints ---

@router.post("/days/", response_model=TrainingDayResponse, summary="Create Training Day")
async def create_day_route(
    payload: TrainingDayCreate,
    current_user: dict = Depends(get_current_user),
):
    return await create_training_day(payload, current_user)


@router.get("/weeks/{week_id}/days", response_model=List[TrainingDayResponse], summary="Get Days for a Training Week")
async def get_week_days_route(
    week_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await get_days_for_week(week_id, current_user)


@router.get("/days/{day_id}", response_model=TrainingDayResponse, summary="Get Training Day by ID")
async def get_day_by_id_route(
    day_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await get_training_day_by_id(day_id, current_user)


@router.put("/days/{day_id}", response_model=TrainingDayResponse, summary="Update Training Day")
async def update_day_route(
    day_id: str,
    payload: TrainingDayUpdate,
    current_user: dict = Depends(get_current_user),
):
    return await update_training_day(day_id, payload, current_user)


@router.delete("/days/{day_id}", summary="Delete Training Day")
async def delete_day_route(
    day_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await delete_training_day(day_id, current_user)
