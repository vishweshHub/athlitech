from fastapi import APIRouter, Depends
from models.athlete_model import Athlete

from services.auth_service import get_current_user, require_coach_or_admin
from services.athlete_service import (
    register_athlete,
    get_all_athletes,
    update_weight,
    delete_all
)

router = APIRouter()


@router.post("/register", dependencies=[Depends(require_coach_or_admin)])
async def register(athlete: Athlete, current_user: dict = Depends(get_current_user)):
    return await register_athlete(athlete)


@router.get("/athletes", dependencies=[Depends(require_coach_or_admin)])
async def get_athletes(current_user: dict = Depends(get_current_user)):
    return await get_all_athletes()


@router.put("/update-weight/{name}", dependencies=[Depends(require_coach_or_admin)])
async def update_athlete_weight(
    name: str,
    weight: int,
    current_user: dict = Depends(get_current_user)
):
    return await update_weight(name, weight)


@router.delete("/athletes", dependencies=[Depends(require_coach_or_admin)])
async def delete_athletes(current_user: dict = Depends(get_current_user)):
    return await delete_all()
