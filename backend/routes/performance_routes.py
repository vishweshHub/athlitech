from fastapi import APIRouter, Depends, HTTPException
from typing import List
from services.auth_service import get_current_user
from services.performance_service import add_performance, get_athlete_performances
from schemas.performance_schema import PerformanceCreate, PerformanceRead
from models.performance_model import Performance
from database.mongodb import athletes_collection, users_collection
from bson.objectid import ObjectId

router = APIRouter(prefix="/performances", tags=["Performance"])

@router.post("/", response_model=dict)
async def create_performance(
    perf_data: PerformanceCreate,
    current_user: dict = Depends(get_current_user)
):
    # Only coaches can add performance records
    if current_user.get("role") != "coach":
        raise HTTPException(status_code=403, detail="Only coaches can add performance records")

    # Resolve coach internal ID
    if not ObjectId.is_valid(current_user.get("id")):
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    coach_doc = await users_collection.find_one({"_id": ObjectId(current_user.get("id"))})
    if not coach_doc:
        raise HTTPException(status_code=404, detail="Coach not found")
    coach_id = coach_doc.get("coach_id")
    if not coach_id:
        raise HTTPException(status_code=400, detail="Coach ID not configured for this user")

    # Verify athlete exists
    athlete = await athletes_collection.find_one({"athlete_id": perf_data.athlete_id})
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    # Verify athlete assigned to this coach
    if athlete.get("coach_id") != coach_id:
        raise HTTPException(status_code=403, detail="Athlete is not assigned to this coach")

    performance = Performance(
        athlete_id=perf_data.athlete_id,
        coach_id=coach_id,
        date=perf_data.date,
        sprint_time=perf_data.sprint_time,
        weight=perf_data.weight,
        height=perf_data.height,
        coach_remarks=perf_data.coach_remarks,
    )
    return await add_performance(performance)

@router.get("/athlete/{athlete_id}", response_model=List[PerformanceRead])
async def get_athlete_performance_history(
    athlete_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Athlete can view own history
    if current_user.get("role") == "athlete":
        if current_user.get("id") != athlete_id:
            raise HTTPException(status_code=403, detail="Athletes can only view their own performance history")
    # Coach can view assigned athletes
    elif current_user.get("role") == "coach":
        if not ObjectId.is_valid(current_user.get("id")):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        coach_doc = await users_collection.find_one({"_id": ObjectId(current_user.get("id"))})
        if not coach_doc:
            raise HTTPException(status_code=404, detail="Coach not found")
        coach_id = coach_doc.get("coach_id")
        athlete = await athletes_collection.find_one({"athlete_id": athlete_id})
        if not athlete or athlete.get("coach_id") != coach_id:
            raise HTTPException(status_code=403, detail="Coaches can only view performances of their assigned athletes")
    elif current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    records = await get_athlete_performances(athlete_id)
    return [PerformanceRead(**rec) for rec in records]

