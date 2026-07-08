from fastapi import HTTPException
from bson.objectid import ObjectId
from typing import List

from repositories.workout_repository import workout_repository
from repositories.coach_repository import coach_repository
from repositories.athlete_repository import athlete_repository
from models.workout_model import Workout
from schemas.workout_schema import WorkoutCreate, WorkoutRead, WorkoutUpdateStatus


async def create_workout(workout_data: WorkoutCreate, current_user: dict):
    if current_user.get("role") != "coach":
        raise HTTPException(status_code=403, detail="Only coaches can create workouts")

    # Get the coach's coach_id
    if not ObjectId.is_valid(current_user.get("id")):
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    coach = await coach_repository.find_by_id(current_user.get("id"))
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")

    coach_id = coach.get("coach_id") or str(coach["_id"])

    # Check if athlete exists
    athlete = await athlete_repository.find_by_id(workout_data.athlete_id)
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

    await workout_repository.create(new_workout.dict())
    return {"message": "Workout plan created successfully", "workout_id": new_workout.workout_id}


async def get_coach_workouts(coach_id: str, current_user: dict) -> List[WorkoutRead]:
    # Coach can only view their own workouts
    if current_user.get("role") == "coach":
        if not ObjectId.is_valid(current_user.get("id")):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        coach = await coach_repository.find_by_id(current_user.get("id"))
        user_coach_id = coach.get("coach_id") or str(coach["_id"]) if coach else None
        if not coach or user_coach_id != coach_id:
            raise HTTPException(status_code=403, detail="Coaches can only view their own workouts")
    elif current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    workouts = await workout_repository.get_by_coach(coach_id)
    return [
        WorkoutRead(
            workout_id=w.get("workout_id"),
            title=w.get("title"),
            description=w.get("description"),
            coach_id=w.get("coach_id"),
            athlete_id=w.get("athlete_id"),
            exercises=w.get("exercises"),
            date=w.get("date"),
            status=w.get("status"),
            created_at=w.get("created_at")
        )
        for w in workouts
    ]


async def get_athlete_workouts(athlete_id: str, current_user: dict) -> List[WorkoutRead]:
    # Athlete can view their own workouts. Coach can view their assigned athlete's workouts. Admin can view all.
    if current_user.get("role") == "athlete":
        if current_user.get("id") != athlete_id:
            raise HTTPException(status_code=403, detail="Athletes can only view their own workouts")
    elif current_user.get("role") == "coach":
        if not ObjectId.is_valid(current_user.get("id")):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        coach = await coach_repository.find_by_id(current_user.get("id"))
        if not coach:
            raise HTTPException(status_code=404, detail="Coach not found")
        coach_id = coach.get("coach_id") or str(coach["_id"])
        athlete = await athlete_repository.find_by_id(athlete_id)
        if not athlete or athlete.get("coach_id") != coach_id:
            raise HTTPException(status_code=403, detail="Coaches can only view workouts for their assigned athletes")
    elif current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    workouts = await workout_repository.get_by_athlete(athlete_id)
    return [
        WorkoutRead(
            workout_id=w.get("workout_id"),
            title=w.get("title"),
            description=w.get("description"),
            coach_id=w.get("coach_id"),
            athlete_id=w.get("athlete_id"),
            exercises=w.get("exercises"),
            date=w.get("date"),
            status=w.get("status"),
            created_at=w.get("created_at")
        )
        for w in workouts
    ]


async def update_workout_status(workout_id: str, status_update: WorkoutUpdateStatus, current_user: dict):
    if current_user.get("role") != "athlete":
        raise HTTPException(status_code=403, detail="Only athletes can update workout status")

    workout = await workout_repository.find_by_workout_id(workout_id)
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    if workout.get("athlete_id") != current_user.get("id"):
        raise HTTPException(status_code=403, detail="Athletes can only update the status of their own workouts")

    await workout_repository.update_status(workout_id, status_update.status)
    return {"message": "Workout status updated successfully", "workout_id": workout_id, "status": status_update.status}
