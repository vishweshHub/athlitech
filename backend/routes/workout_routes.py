from fastapi import APIRouter, Depends, HTTPException
from database.mongodb import workouts_collection, athletes_collection, users_collection
from schemas.workout_schema import WorkoutCreate, WorkoutRead, WorkoutUpdateStatus
from services.auth_service import get_current_user
from models.workout_model import Workout
from bson.objectid import ObjectId
from typing import List


router = APIRouter(prefix="/workouts", tags=["Workouts"])


@router.post("/", response_model=dict)
async def create_workout(workout_data: WorkoutCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "coach":
        raise HTTPException(status_code=403, detail="Only coaches can create workouts")

    # Get the coach's coach_id
    if not ObjectId.is_valid(current_user.get("id")):
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    coach = await users_collection.find_one({"_id": ObjectId(current_user.get("id"))})
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")

    coach_id = coach.get("coach_id")
    if not coach_id:
        raise HTTPException(status_code=400, detail="Coach ID not configured for this user")

    # Check if athlete exists
    athlete = await athletes_collection.find_one({"athlete_id": workout_data.athlete_id})
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    # Verify that the athlete is assigned to this coach
    if athlete.get("coach_id") != coach_id:
        raise HTTPException(status_code=403, detail="Athlete is not assigned to this coach")

    new_workout = Workout(
        title=workout_data.title,
        description=workout_data.description,
        coach_id=coach_id,
        athlete_id=workout_data.athlete_id,
        exercises=[dict(ex) for ex in workout_data.exercises],
        date=workout_data.date,
        status=workout_data.status
    )

    await workouts_collection.insert_one(new_workout.dict())
    return {"message": "Workout plan created successfully", "workout_id": new_workout.workout_id}


@router.get("/coach/{coach_id}", response_model=List[WorkoutRead])
async def get_coach_workouts(coach_id: str, current_user: dict = Depends(get_current_user)):
    # Coach can only view their own workouts
    if current_user.get("role") == "coach":
        if not ObjectId.is_valid(current_user.get("id")):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        coach = await users_collection.find_one({"_id": ObjectId(current_user.get("id"))})
        if not coach or coach.get("coach_id") != coach_id:
            raise HTTPException(status_code=403, detail="Coaches can only view their own workouts")
    elif current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    workouts = []
    async for w in workouts_collection.find({"coach_id": coach_id}):
        workouts.append(WorkoutRead(
            workout_id=w.get("workout_id"),
            title=w.get("title"),
            description=w.get("description"),
            coach_id=w.get("coach_id"),
            athlete_id=w.get("athlete_id"),
            exercises=w.get("exercises"),
            date=w.get("date"),
            status=w.get("status"),
            created_at=w.get("created_at")
        ))
    return workouts


@router.get("/athlete/{athlete_id}", response_model=List[WorkoutRead])
async def get_athlete_workouts(athlete_id: str, current_user: dict = Depends(get_current_user)):
    # Athlete can view their own workouts. Coach can view their assigned athlete's workouts. Admin can view all.
    if current_user.get("role") == "athlete":
        if current_user.get("id") != athlete_id:
            raise HTTPException(status_code=403, detail="Athletes can only view their own workouts")
    elif current_user.get("role") == "coach":
        if not ObjectId.is_valid(current_user.get("id")):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        coach = await users_collection.find_one({"_id": ObjectId(current_user.get("id"))})
        if not coach:
            raise HTTPException(status_code=404, detail="Coach not found")
        athlete = await athletes_collection.find_one({"athlete_id": athlete_id})
        if not athlete or athlete.get("coach_id") != coach.get("coach_id"):
            raise HTTPException(status_code=403, detail="Coaches can only view workouts for their assigned athletes")
    elif current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    workouts = []
    async for w in workouts_collection.find({"athlete_id": athlete_id}):
        workouts.append(WorkoutRead(
            workout_id=w.get("workout_id"),
            title=w.get("title"),
            description=w.get("description"),
            coach_id=w.get("coach_id"),
            athlete_id=w.get("athlete_id"),
            exercises=w.get("exercises"),
            date=w.get("date"),
            status=w.get("status"),
            created_at=w.get("created_at")
        ))
    return workouts


@router.put("/{workout_id}/status", response_model=dict)
async def update_workout_status(workout_id: str, status_update: WorkoutUpdateStatus, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "athlete":
        raise HTTPException(status_code=403, detail="Only athletes can update workout status")

    workout = await workouts_collection.find_one({"workout_id": workout_id})
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    if workout.get("athlete_id") != current_user.get("id"):
        raise HTTPException(status_code=403, detail="Athletes can only update the status of their own workouts")

    await workouts_collection.update_one(
        {"workout_id": workout_id},
        {"$set": {"status": status_update.status}}
    )
    return {"message": "Workout status updated successfully", "workout_id": workout_id, "status": status_update.status}
