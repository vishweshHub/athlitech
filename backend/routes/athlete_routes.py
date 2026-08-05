from fastapi import APIRouter, Depends, HTTPException, Query

from database.mongodb import athletes_collection, users_collection
from services.athlete_service import assign_athlete_to_coach
from services.auth_service import get_current_user, require_coach_or_admin

router = APIRouter(tags=["Athletes"])


@router.post("/athletes/{athlete_id}/assign/{coach_id}", dependencies=[Depends(require_coach_or_admin)], tags=["Coaches"])
async def assign_athlete(athlete_id: str, coach_id: str, current_user: dict = Depends(get_current_user)):
    if "admin" not in current_user.get("active_roles", set()):
        user = await users_collection.find_one({"email": current_user.get("email")})
        if not user:
            raise HTTPException(status_code=403, detail="Coaches can only assign athletes to themselves")
        user_coach_id = user.get("coach_id") or str(user["_id"])
        if user_coach_id != coach_id and str(user["_id"]) != coach_id:
            raise HTTPException(status_code=403, detail="Coaches can only assign athletes to themselves")

    overwrite = "admin" in current_user.get("active_roles", set())
    return await assign_athlete_to_coach(athlete_id, coach_id, overwrite=overwrite)


@router.get("/coaches/{coach_id}/athletes", dependencies=[Depends(require_coach_or_admin)], tags=["Coaches"])
async def get_coach_athletes(
    coach_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    sport: str | None = Query(None),
    search: str | None = Query(None),
    current_user: dict = Depends(get_current_user)
):
    user = await users_collection.find_one({"email": current_user.get("email")})
    user_coach_id = user.get("coach_id") if user else None
    user_account_id = str(user["_id"]) if user else None

    if "admin" not in current_user.get("active_roles", set()):
        if not user:
            raise HTTPException(status_code=403, detail="Coaches can only view their own athletes")
        if user_coach_id != coach_id and user_account_id != coach_id:
            raise HTTPException(status_code=403, detail="Coaches can only view their own athletes")

    from bson.objectid import ObjectId

    coach_match = [coach_id]
    if user_coach_id:
        coach_match.append(user_coach_id)
    if user_account_id:
        coach_match.append(user_account_id)

    query = {"coach_id": {"$in": list(set(coach_match))}}
    if sport:
        query["sport"] = sport
    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    raw_athletes = []
    async for a in athletes_collection.find(query).skip(skip).limit(limit):
        raw_athletes.append(a)

    # Resolve all users in a single batch query
    ath_ids = list({a.get("athlete_id") for a in raw_athletes if a.get("athlete_id")})
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

    athletes = []
    for a in raw_athletes:
        ath_id = a.get("athlete_id")
        if ath_id in user_map:
            athletes.append({
                "athlete_id": a.get("athlete_id"),
                "name": a.get("name"),
                "sport": a.get("sport"),
                "weight": a.get("weight"),
                "coach_id": a.get("coach_id"),
            })

    return athletes


@router.get("/athletes/", dependencies=[Depends(require_coach_or_admin)], tags=["Athletes"])
async def list_athletes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    sport: str | None = Query(None),
    coach_id: str | None = Query(None),
    search: str | None = Query(None),
    current_user: dict = Depends(get_current_user)
):
    from bson.objectid import ObjectId

    query = {}
    if sport:
        query["sport"] = sport
    if coach_id:
        query["coach_id"] = coach_id
    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    raw_athletes = []
    async for a in athletes_collection.find(query).skip(skip).limit(limit):
        raw_athletes.append(a)

    ath_ids = list({a.get("athlete_id") for a in raw_athletes if a.get("athlete_id")})
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

    athletes = []
    for a in raw_athletes:
        ath_id = a.get("athlete_id")
        if ath_id in user_map:
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
    from bson.objectid import ObjectId
    from core.permissions import normalize_role
    from core.utils import get_utc_now

    user_val = None
    if ObjectId.is_valid(athlete_id):
        user_val = await users_collection.find_one({"_id": ObjectId(athlete_id)})
    if not user_val:
        user_val = await users_collection.find_one({"_id": athlete_id})

    athlete = await athletes_collection.find_one({
        "$or": [
            {"athlete_id": athlete_id},
            {"account_id": athlete_id},
            {"owner_account_id": athlete_id},
            {"owner_id": athlete_id}
        ]
    })

    current_user_id = str(current_user.get("id"))
    current_account_id = str(current_user.get("account_id") or current_user_id)

    if not athlete and user_val and (athlete_id == current_user_id or athlete_id == current_account_id):
        name = current_user.get("name") or user_val.get("name", "Athlete")
        athlete = {
            "athlete_id": current_user_id,
            "account_id": current_account_id,
            "owner_account_id": current_account_id,
            "owner_id": current_user_id,
            "name": name,
            "sport": "General Athletics",
            "weight": 70,
            "coach_id": None,
            "created_at": get_utc_now(),
            "updated_at": get_utc_now(),
        }
        await athletes_collection.insert_one(athlete)

    if not athlete:
        if not user_val:
            raise HTTPException(status_code=404, detail="Athlete not found")
        raise HTTPException(status_code=404, detail="Athlete profile not found")

    active_roles = current_user.get("active_roles", set())
    user_role = normalize_role(current_user.get("role", "athlete"))

    is_owner = (
        athlete.get("owner_id") == current_user_id or
        athlete.get("athlete_id") == current_user_id or
        athlete.get("owner_account_id") == current_user_id or
        athlete.get("account_id") == current_user_id or
        athlete.get("owner_id") == current_account_id or
        athlete.get("athlete_id") == current_account_id or
        athlete.get("owner_account_id") == current_account_id or
        athlete.get("account_id") == current_account_id
    )

    if ("athlete" in active_roles or user_role == "athlete") and is_owner:
        pass
    elif "admin" in active_roles or user_role == "admin":
        pass
    elif "coach" in active_roles or user_role == "coach":
        user_coach_id = current_user.get("coach_id") or current_user_id
        if user_coach_id != athlete.get("coach_id"):
            raise HTTPException(status_code=403, detail="Coaches can only access their assigned athletes")
    elif "athlete" in active_roles or user_role == "athlete":
        if not is_owner:
            raise HTTPException(status_code=403, detail="Athletes can only access their own profile")
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    return {
        "athlete_id": athlete.get("athlete_id"),
        "account_id": athlete.get("account_id") or athlete.get("athlete_id"),
        "owner_account_id": athlete.get("owner_account_id") or athlete.get("account_id") or athlete.get("athlete_id"),
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
