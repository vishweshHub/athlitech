from fastapi import APIRouter, Depends, HTTPException

from database.mongodb import athletes_collection, users_collection
from services.athlete_service import assign_athlete_to_coach
from services.auth_service import get_current_user, require_coach_or_admin

router = APIRouter(tags=["Athletes"])


@router.post("/athletes/{athlete_id}/assign/{coach_id}", dependencies=[Depends(require_coach_or_admin)], tags=["Coaches"])
async def assign_athlete(athlete_id: str, coach_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") == "coach":
        user = await users_collection.find_one({"email": current_user.get("email")})
        if not user:
            raise HTTPException(status_code=403, detail="Coaches can only assign athletes to themselves")
        user_coach_id = user.get("coach_id") or str(user["_id"])
        if user_coach_id != coach_id:
            raise HTTPException(status_code=403, detail="Coaches can only assign athletes to themselves")

    overwrite = current_user.get("role") == "admin"
    return await assign_athlete_to_coach(athlete_id, coach_id, overwrite=overwrite)


@router.get("/coaches/{coach_id}/athletes", dependencies=[Depends(require_coach_or_admin)], tags=["Coaches"])
async def get_coach_athletes(coach_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") == "coach":
        user = await users_collection.find_one({"email": current_user.get("email")})
        if not user:
            raise HTTPException(status_code=403, detail="Coaches can only view their own athletes")
        user_coach_id = user.get("coach_id") or str(user["_id"])
        if user_coach_id != coach_id:
            raise HTTPException(status_code=403, detail="Coaches can only view their own athletes")

    athletes = []
    async for a in athletes_collection.find({"coach_id": coach_id}):
        athletes.append({
            "athlete_id": a.get("athlete_id"),
            "name": a.get("name"),
            "sport": a.get("sport"),
            "weight": a.get("weight"),
            "coach_id": a.get("coach_id"),
        })

    return athletes


@router.get("/athletes/", dependencies=[Depends(require_coach_or_admin)], tags=["Athletes"])
async def list_athletes(current_user: dict = Depends(get_current_user)):
    athletes = []
    async for a in athletes_collection.find():
        athletes.append({
            "athlete_id": a.get("athlete_id"),
            "name": a.get("name"),
            "sport": a.get("sport"),
            "weight": a.get("weight"),
            "coach_id": a.get("coach_id"),
        })
    return athletes


@router.get("/coaches/{coach_id}", tags=["Coaches"])
async def get_coach_by_id(coach_id: str):
    coach = await users_collection.find_one({"coach_id": coach_id})
    from bson.objectid import ObjectId

    if not coach and ObjectId.is_valid(coach_id):
        coach = await users_collection.find_one({"_id": ObjectId(coach_id)})

    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")

    return {
        "id": str(coach.get("_id")),
        "name": coach.get("name"),
        "email": coach.get("email"),
        "role": coach.get("role"),
        "coach_id": coach.get("coach_id"),
    }


@router.get("/athletes/{athlete_id}", tags=["Athletes"])
async def get_athlete_by_id(athlete_id: str, current_user: dict = Depends(get_current_user)):
    athlete = await athletes_collection.find_one({"athlete_id": athlete_id})
    from bson.objectid import ObjectId

    if not athlete:
        user = await users_collection.find_one({"_id": ObjectId(athlete_id)}) if ObjectId.is_valid(athlete_id) else None
        if user and user.get("role", "").lower() == "athlete":
            athlete = {
                "athlete_id": athlete_id,
                "name": user.get("name"),
                "sport": "Sprinting",
                "weight": 70,
                "coach_id": None,
            }
        else:
            raise HTTPException(status_code=404, detail="Athlete not found")

    if current_user.get("role") == "admin":
        pass
    elif current_user.get("role") == "coach":
        user = await users_collection.find_one({"email": current_user.get("email")})
        if not user:
            raise HTTPException(status_code=403, detail="Coaches can only access their assigned athletes")
        user_coach_id = user.get("coach_id") or str(user["_id"])
        if user_coach_id != athlete.get("coach_id"):
            raise HTTPException(status_code=403, detail="Coaches can only access their assigned athletes")
    elif current_user.get("role") == "athlete":
        is_owner = athlete.get("owner_id") == current_user.get("id") or athlete.get("athlete_id") == current_user.get("id")
        if not is_owner:
            raise HTTPException(status_code=403, detail="Athletes can only access their own profile")

    return {
        "athlete_id": athlete.get("athlete_id"),
        "name": athlete.get("name"),
        "sport": athlete.get("sport"),
        "weight": athlete.get("weight"),
        "coach_id": athlete.get("coach_id"),
    }


@router.delete("/athletes/{athlete_id}/assign", dependencies=[Depends(require_coach_or_admin)], tags=["Coaches"])
async def unassign_athlete(athlete_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") == "coach":
        user = await users_collection.find_one({"email": current_user.get("email")})
        if not user:
            raise HTTPException(status_code=403, detail="Coaches can only unassign their own athletes")
        user_coach_id = user.get("coach_id") or str(user["_id"])

        athlete = await athletes_collection.find_one({"athlete_id": athlete_id})
        if not athlete or athlete.get("coach_id") != user_coach_id:
            raise HTTPException(status_code=403, detail="Coaches can only unassign their own athletes")

    result = await athletes_collection.update_one(
        {"athlete_id": athlete_id},
        {"$set": {"coach_id": None}}
    )
    if result.matched_count == 0:
        from bson.objectid import ObjectId
        user = None
        if ObjectId.is_valid(athlete_id):
            user = await users_collection.find_one({"_id": ObjectId(athlete_id)})
        if not user:
            user = await users_collection.find_one({"_id": athlete_id})

        if not user:
            raise HTTPException(status_code=404, detail="Athlete not found")

        await athletes_collection.insert_one({
            "athlete_id": athlete_id,
            "name": user["name"],
            "sport": "Sprinting",
            "weight": 70,
            "coach_id": None,
        })

    return {"message": "Coach assignment removed successfully"}
