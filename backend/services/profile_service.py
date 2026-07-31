from bson import ObjectId
from database.mongodb import users_collection, athletes_collection
from repositories.profile_repository import profile_repository
from schemas.profile_schema import CompleteAthleteProfileRequest, CompleteCoachProfileRequest
from services.recommendation_service import recommendation_engine
from datetime import datetime


async def complete_athlete_profile(user_id: str, request: CompleteAthleteProfileRequest) -> dict:
    profile_data = request.model_dump()
    
    # Save into profiles collection
    saved_profile = await profile_repository.save_profile(user_id, "athlete", profile_data)
    
    # Update profile_completed flag on user record
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"profile_completed": True, "updated_at": datetime.utcnow()}}
    )

    # Sync with athletes_collection for dashboard lists if needed
    existing_athlete = await athletes_collection.find_one({"athlete_id": user_id})
    user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
    name = user_doc.get("name", "Athlete") if user_doc else "Athlete"

    if existing_athlete:
        await athletes_collection.update_one(
            {"athlete_id": user_id},
            {"$set": {"sport": request.sport, "weight": int(request.weight) if request.weight else 70}}
        )
    else:
        await athletes_collection.insert_one({
            "athlete_id": user_id,
            "name": name,
            "sport": request.sport,
            "weight": int(request.weight) if request.weight else 70,
            "coach_id": user_doc.get("coach_id") if user_doc else None
        })

    saved_profile["profile_completed"] = True
    return saved_profile


async def complete_coach_profile(user_id: str, request: CompleteCoachProfileRequest) -> dict:
    profile_data = request.model_dump()
    
    # Save into profiles collection
    saved_profile = await profile_repository.save_profile(user_id, "coach", profile_data)
    
    # Update profile_completed flag on user record
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"profile_completed": True, "updated_at": datetime.utcnow()}}
    )

    saved_profile["profile_completed"] = True
    return saved_profile


async def get_user_profile(user_id: str) -> dict:
    profile = await profile_repository.get_profile_by_user_id(user_id)
    user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
    
    profile_completed = user_doc.get("profile_completed", False) if user_doc else False
    role = user_doc.get("role", "athlete") if user_doc else "athlete"

    if not profile:
        profile = {
            "user_id": user_id,
            "role": role,
            "profile_completed": profile_completed,
            "athlete_data": None,
            "coach_data": None,
            "visibility": {"bio_is_public": False, "stats_is_public": False},
        }

    profile["profile_completed"] = profile_completed

    # Synchronize coach assignment from single source of truth db["athletes"]
    if role == "athlete":
        ath_doc = await athletes_collection.find_one({"athlete_id": user_id})
        coach_id = ath_doc.get("coach_id") if ath_doc else None
        if not coach_id and user_doc:
            coach_id = user_doc.get("coach_id")

        coach_name = None
        coach_email = None

        if coach_id:
            coach_user = None
            if ObjectId.is_valid(coach_id):
                try:
                    coach_user = await users_collection.find_one({"_id": ObjectId(coach_id)})
                except Exception:
                    coach_user = None

            if not coach_user:
                coach_user = (
                    await users_collection.find_one({"coach_id": coach_id})
                    or await users_collection.find_one({"id": coach_id})
                )

            if coach_user:
                coach_name = coach_user.get("name")
                coach_email = coach_user.get("email")

        profile["coach_id"] = coach_id
        profile["coach_name"] = coach_name
        profile["coach_email"] = coach_email

        if profile.get("athlete_data"):
            profile["athlete_data"]["coach_id"] = coach_id
            profile["athlete_data"]["coach_name"] = coach_name
            profile["athlete_data"]["coach_email"] = coach_email

    return profile


async def get_workout_recommendations(user_id: str) -> list:
    profile = await profile_repository.get_profile_by_user_id(user_id)
    if profile and profile.get("athlete_data"):
        athlete_data = profile["athlete_data"]
        sport = athlete_data.get("sport", "Athletics")
        event = athlete_data.get("event", "100m")
        return recommendation_engine.get_recommendations(sport, event)
    
    # Fallback to default general athletic recommendations if profile not set
    return recommendation_engine.get_recommendations("Athletics", "General")
