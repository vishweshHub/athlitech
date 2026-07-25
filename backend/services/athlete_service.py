import uuid

from bson.objectid import ObjectId
from fastapi import HTTPException

from repositories.athlete_repository import athlete_repository
from repositories.coach_repository import coach_repository


async def register_athlete(athlete):
    athlete_id = getattr(athlete, "athlete_id", None) or str(uuid.uuid4())
    await athlete_repository.register({
        "athlete_id": athlete_id,
        "name": athlete.name,
        "sport": athlete.sport,
        "weight": athlete.weight,
        "coach_id": getattr(athlete, "coach_id", None),
    })

    return {"message": "Athlete Registered Successfully"}


async def get_all_athletes():
    athletes = []

    all_athletes = await athlete_repository.get_all()
    for athlete in all_athletes:
        athletes.append({
            "name": athlete["name"],
            "sport": athlete["sport"],
            "weight": athlete.get("weight", "Not Provided")
        })

    return athletes


async def update_weight(name: str, weight: int):
    result = await athlete_repository.update_weight(name, weight)
    return {
        "matched": result.matched_count,
        "modified": result.modified_count
    }


async def delete_all():
    result = await athlete_repository.delete_all()
    return {
        "message": f"Deleted {result.deleted_count} athletes"
    }


async def assign_athlete_to_coach(athlete_id: str, coach_id: str, overwrite: bool = False):
    athlete = await athlete_repository.find_by_id(athlete_id)

    coach = await coach_repository.find_by_coach_id(coach_id)
    if not coach:
        coach = await coach_repository.find_by_id(coach_id)

    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")

    if coach.get("role", "athlete") != "coach":
        raise HTTPException(status_code=400, detail="Target user is not a coach")

    actual_coach_id = coach.get("coach_id") or str(coach["_id"])

    if not athlete:
        from bson import ObjectId
        
        user_coll = coach_repository.collection
        user = None
        if ObjectId.is_valid(athlete_id):
            user = await user_coll.find_one({"_id": ObjectId(athlete_id)})
        if not user:
            user = await user_coll.find_one({"_id": athlete_id})

        if not user:
            raise HTTPException(status_code=404, detail="Athlete not found")

        await athlete_repository.register({
            "athlete_id": athlete_id,
            "name": user["name"],
            "sport": "Sprinting",
            "weight": 70,
            "coach_id": actual_coach_id,
        })

        return {
            "message": "Athlete assigned to coach",
            "athlete_id": athlete_id,
            "coach_id": actual_coach_id,
            "modified": 1,
        }

    current_coach = athlete.get("coach_id")
    if current_coach == actual_coach_id:
        return {"message": "Athlete already assigned to this coach"}

    if current_coach and current_coach != actual_coach_id and not overwrite:
        raise HTTPException(
            status_code=409,
            detail=f"Athlete already assigned to another coach: {current_coach}",
        )

    result = await athlete_repository.assign_coach(athlete_id, actual_coach_id)

    if result.modified_count == 0 and result.matched_count == 0:
        raise HTTPException(status_code=500, detail="Failed to assign athlete to coach")

    return {
        "message": "Athlete assigned to coach",
        "athlete_id": athlete_id,
        "coach_id": actual_coach_id,
        "modified": result.modified_count,
    }