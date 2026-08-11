from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from services.auth_service import get_current_user, require_admin, normalize_role
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
    active_roles = current_user.get("active_roles", set())
    if "coach" not in active_roles and current_user.get("role") != "coach":
        raise HTTPException(status_code=403, detail="Only coaches can add performance records")

    # Resolve coach internal ID
    if not ObjectId.is_valid(current_user.get("id")):
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    coach_doc = await coach_repository.find_by_id(current_user.get("id"))
    if not coach_doc:
        raise HTTPException(status_code=404, detail="Coach not found")
    coach_id = coach_doc.get("coach_id") or str(coach_doc["_id"])
    coach_user_id = str(coach_doc["_id"])

    # Verify athlete exists
    athlete = await athlete_repository.find_by_id(perf_data.athlete_id)
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    # Verify athlete assigned to this coach
    if athlete.get("coach_id") != coach_id and athlete.get("coach_id") != coach_user_id:
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
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    sport_event: str | None = Query(None),
    current_user: dict = Depends(get_current_user)
):
    active_roles = current_user.get("active_roles", set())
    user_role = normalize_role(current_user.get("role", "athlete"))
    current_id = str(current_user.get("id"))
    current_account_id = str(current_user.get("account_id") or current_id)
    is_self = (current_id == athlete_id or current_account_id == athlete_id)

    if ("athlete" in active_roles or user_role == "athlete") and is_self:
        pass
    elif "admin" in active_roles or user_role == "admin":
        pass
    elif "coach" in active_roles or user_role == "coach":
        if not ObjectId.is_valid(current_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        coach_doc = await coach_repository.find_by_id(current_id)
        if not coach_doc:
            raise HTTPException(status_code=404, detail="Coach not found")
        coach_id = coach_doc.get("coach_id") or str(coach_doc["_id"])
        coach_user_id = str(coach_doc["_id"])
        athlete = await athlete_repository.find_by_id(athlete_id)
        if not athlete or (athlete.get("coach_id") != coach_id and athlete.get("coach_id") != coach_user_id):
            raise HTTPException(status_code=403, detail="Coaches can only view performances of their assigned athletes")
    elif "athlete" in active_roles or user_role == "athlete":
        if not is_self:
            raise HTTPException(status_code=403, detail="Athletes can only view their own performance history")
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    records = await get_athlete_performances(athlete_id, skip=skip, limit=limit, sport_event=sport_event)
    return [PerformanceRead(**rec) for rec in records]


@router.get("/", response_model=List[PerformanceRead], dependencies=[Depends(require_admin)])
async def get_all_performances(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    sport_event: str | None = Query(None),
    search: str | None = Query(None),
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if sport_event:
        query["sport_event"] = sport_event
    if search:
        query["$or"] = [
            {"coach_remarks": {"$regex": search, "$options": "i"}},
            {"feedback": {"$regex": search, "$options": "i"}},
            {"sport_event": {"$regex": search, "$options": "i"}},
        ]

    records = []
    from database.mongodb import performance_collection, users_collection
    from bson.objectid import ObjectId
    async for rec in performance_collection.find(query).skip(skip).limit(limit):
        records.append(rec)

    ath_ids = list({rec.get("athlete_id") for rec in records if rec.get("athlete_id")})
    object_ids = [ObjectId(uid) for uid in ath_ids if ObjectId.is_valid(uid)]
    string_ids = [uid for uid in ath_ids if not ObjectId.is_valid(uid)]
    
    user_query = {"$or": []}
    if object_ids:
        user_query["$or"].append({"_id": {"$in": object_ids}})
    if string_ids:
        user_query["$or"].append({"_id": {"$in": string_ids}})

    user_map = {}
    if user_query["$or"]:
        async for u in users_collection.find(user_query):
            user_map[str(u["_id"])] = u

    valid_records = []
    for rec in records:
        ath_id = rec.get("athlete_id")
        if ath_id in user_map:
            valid_records.append(rec)

    return [PerformanceRead(**rec) for rec in valid_records]
