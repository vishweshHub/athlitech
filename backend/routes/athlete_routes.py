from fastapi import APIRouter, Depends, HTTPException

from database.mongodb import athletes_collection, users_collection
from services.athlete_service import assign_athlete_to_coach
from services.auth_service import get_current_user, require_coach_or_admin

router = APIRouter(tags=["Athletes"])


@router.post("/athletes/{athlete_id}/assign/{coach_id}", dependencies=[Depends(require_coach_or_admin)], tags=["Coaches"])
async def assign_athlete(athlete_id: str, coach_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") == "coach":
        user = await users_collection.find_one({"email": current_user.get("email")})
        if not user or user.get("coach_id") != coach_id:
            raise HTTPException(status_code=403, detail="Coaches can only assign athletes to themselves")

    return await assign_athlete_to_coach(athlete_id, coach_id)


@router.get("/coaches/{coach_id}/athletes", dependencies=[Depends(require_coach_or_admin)], tags=["Coaches"])
async def get_coach_athletes(coach_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") == "coach":
        user = await users_collection.find_one({"email": current_user.get("email")})
        if not user or user.get("coach_id") != coach_id:
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
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    if current_user.get("role") == "admin":
        pass
    elif current_user.get("role") == "coach":
        user = await users_collection.find_one({"email": current_user.get("email")})
        if not user or user.get("coach_id") != athlete.get("coach_id"):
            raise HTTPException(status_code=403, detail="Coaches can only access their assigned athletes")
    elif current_user.get("role") == "athlete":
        if athlete.get("owner_id") and athlete.get("owner_id") != current_user.get("id"):
            raise HTTPException(status_code=403, detail="Athletes can only access their own profile")
        if not athlete.get("owner_id"):
            raise HTTPException(status_code=403, detail="Athletes cannot access this profile")

    return {
        "athlete_id": athlete.get("athlete_id"),
        "name": athlete.get("name"),
        "sport": athlete.get("sport"),
        "weight": athlete.get("weight"),
        "coach_id": athlete.get("coach_id"),
    }
