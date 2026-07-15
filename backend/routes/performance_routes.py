from fastapi import APIRouter, Depends, HTTPException
from typing import List
from services.auth_service import get_current_user, require_admin
from services.performance_service import add_performance, get_athlete_performances
from schemas.performance_schema import PerformanceCreate, PerformanceRead
from models.performance_model import Performance
from repositories.coach_repository import coach_repository
from repositories.athlete_repository import athlete_repository
from repositories.workout_repository import workout_repository
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
    coach_doc = await coach_repository.find_by_id(current_user.get("id"))
    if not coach_doc:
        raise HTTPException(status_code=404, detail="Coach not found")
    coach_id = coach_doc.get("coach_id") or str(coach_doc["_id"])

    # Verify athlete exists
    athlete = await athlete_repository.find_by_id(perf_data.athlete_id)
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    # Verify athlete assigned to this coach
    if athlete.get("coach_id") != coach_id:
        raise HTTPException(status_code=403, detail="Athlete is not assigned to this coach")

    # Verify workout exists and is completed (if provided)
    if perf_data.workout_id:
        workout = await workout_repository.find_by_workout_id(perf_data.workout_id)
        if not workout:
            raise HTTPException(status_code=404, detail="Workout not found")
        if workout.get("status") != "completed":
            raise HTTPException(status_code=400, detail="Performance record can only be created for completed workouts")

    performance = Performance(
        athlete_id=perf_data.athlete_id,
        coach_id=coach_id,
        date=perf_data.date,
        sprint_time=perf_data.sprint_time,
        weight=perf_data.weight,
        height=perf_data.height,
        coach_remarks=perf_data.coach_remarks,
        # New linked fields
        workout_id=perf_data.workout_id,
        sport_event=perf_data.sport_event,
        value=perf_data.value,
        unit=perf_data.unit,
        feedback=perf_data.feedback,
        recorded_at=perf_data.recorded_at,
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
        coach_doc = await coach_repository.find_by_id(current_user.get("id"))
        if not coach_doc:
            raise HTTPException(status_code=404, detail="Coach not found")
        coach_id = coach_doc.get("coach_id") or str(coach_doc["_id"])
        athlete = await athlete_repository.find_by_id(athlete_id)
        if not athlete or athlete.get("coach_id") != coach_id:
            raise HTTPException(status_code=403, detail="Coaches can only view performances of their assigned athletes")
    elif current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    records = await get_athlete_performances(athlete_id)
    return [PerformanceRead(**rec) for rec in records]


@router.get("/", response_model=List[PerformanceRead], dependencies=[Depends(require_admin)])
async def get_all_performances(current_user: dict = Depends(get_current_user)):
    records = []
    from database.mongodb import performance_collection, users_collection
    from bson.objectid import ObjectId
    async for rec in performance_collection.find():
        records.append(rec)

    valid_records = []
    for rec in records:
        ath_id = rec.get("athlete_id")
        if not ath_id:
            continue
        user_exists = False
        if ObjectId.is_valid(ath_id):
            user = await users_collection.find_one({"_id": ObjectId(ath_id)})
            if user:
                user_exists = True
        else:
            user = await users_collection.find_one({"_id": ath_id})
            if user:
                user_exists = True
        if user_exists:
            valid_records.append(rec)

    return [PerformanceRead(**rec) for rec in valid_records]
