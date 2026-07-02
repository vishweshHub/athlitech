import uuid

from bson.objectid import ObjectId
from fastapi import HTTPException

from database.mongodb import athletes_collection, users_collection


async def register_athlete(athlete):
    athlete_id = getattr(athlete, "athlete_id", None) or str(uuid.uuid4())
    await athletes_collection.insert_one({
        "athlete_id": athlete_id,
        "name": athlete.name,
        "sport": athlete.sport,
        "weight": athlete.weight,
        "coach_id": getattr(athlete, "coach_id", None),
    })

    return {"message": "Athlete Registered Successfully"}


async def get_all_athletes():
    athletes = []

    async for athlete in athletes_collection.find():
        athletes.append({
            "name": athlete["name"],
            "sport": athlete["sport"],
            "weight": athlete.get("weight", "Not Provided")
        })

    return athletes


async def update_weight(name: str, weight: int):
    result = await athletes_collection.update_one(
        {"name": name},
        {"$set": {"weight": weight}}
    )

    return {
        "matched": result.matched_count,
        "modified": result.modified_count
    }


async def delete_all():
    result = await athletes_collection.delete_many({})

    return {
        "message": f"Deleted {result.deleted_count} athletes"
    }


async def assign_athlete_to_coach(athlete_id: str, coach_id: str):
    athlete = await athletes_collection.find_one({"athlete_id": athlete_id})
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    coach = await users_collection.find_one({"coach_id": coach_id})
    if not coach:
        try:
            if ObjectId.is_valid(coach_id):
                coach = await users_collection.find_one({"_id": ObjectId(coach_id)})
        except Exception:
            coach = None

    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")

    if coach.get("role", "athlete") != "coach":
        raise HTTPException(status_code=400, detail="Target user is not a coach")

    current_coach = athlete.get("coach_id")
    if current_coach == coach_id:
        return {"message": "Athlete already assigned to this coach"}

    if current_coach and current_coach != coach_id:
        raise HTTPException(
            status_code=409,
            detail=f"Athlete already assigned to another coach: {current_coach}",
        )

    result = await athletes_collection.update_one(
        {"athlete_id": athlete_id},
        {"$set": {"coach_id": coach_id}},
    )

    if result.modified_count == 0 and result.matched_count == 0:
        raise HTTPException(status_code=500, detail="Failed to assign athlete to coach")

    return {
        "message": "Athlete assigned to coach",
        "athlete_id": athlete_id,
        "coach_id": coach_id,
        "modified": result.modified_count,
    }