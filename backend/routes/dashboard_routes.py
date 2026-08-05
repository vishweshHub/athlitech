from fastapi import APIRouter, Depends, HTTPException
from schemas.dashboard_schema import AdminSummaryRead, CoachSummaryRead, AthleteSummaryRead
from services.auth_service import get_current_user, require_admin, require_coach_or_admin
from services.dashboard_service import get_admin_summary, get_coach_summary, get_athlete_summary
from repositories.coach_repository import coach_repository
from repositories.athlete_repository import athlete_repository
from bson.objectid import ObjectId

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/admin/summary", response_model=AdminSummaryRead, dependencies=[Depends(require_admin)])
async def read_admin_summary(current_user: dict = Depends(get_current_user)):
    try:
        return await get_admin_summary(current_user.get("id"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch admin dashboard summary: {str(e)}")

@router.get("/coach/{coach_id}/summary", response_model=CoachSummaryRead, dependencies=[Depends(require_coach_or_admin)])
async def read_coach_summary(coach_id: str, current_user: dict = Depends(get_current_user)):
    active_roles = current_user.get("active_roles", set())
    if "admin" not in active_roles and current_user.get("role") != "admin":
        from database.mongodb import users_collection
        user_id = current_user.get("id")
        user_doc = await users_collection.find_one({"email": current_user.get("email")})
        user_coach_id = user_doc.get("coach_id") if user_doc else None

        coach_doc = await coach_repository.find_by_id(user_id) if user_id else None
        repo_coach_id = coach_doc.get("coach_id") if coach_doc else None

        allowed_ids = {user_id, user_coach_id, repo_coach_id}
        allowed_ids.discard(None)

        if coach_id not in allowed_ids:
            raise HTTPException(status_code=403, detail="Coaches can only view their own dashboard summary")
    
    try:
        return await get_coach_summary(coach_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch coach dashboard summary: {str(e)}")

@router.get("/athlete/{athlete_id}/summary", response_model=AthleteSummaryRead)
async def read_athlete_summary(athlete_id: str, current_user: dict = Depends(get_current_user)):
    from core.permissions import normalize_role
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
        coach_doc = await coach_repository.find_by_id(current_id)
        resolved_coach_id = coach_doc.get("coach_id") if coach_doc else None
        resolved_user_id = str(coach_doc["_id"]) if coach_doc else None
        athlete = await athlete_repository.find_by_id(athlete_id)
        if not athlete or (athlete.get("coach_id") != resolved_coach_id and athlete.get("coach_id") != resolved_user_id):
            raise HTTPException(status_code=403, detail="Coaches can only view summaries of their assigned athletes")
    elif "athlete" in active_roles or user_role == "athlete":
        if not is_self:
            raise HTTPException(status_code=403, detail="Athletes can only view their own dashboard summary")
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
        
    try:
        return await get_athlete_summary(athlete_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch athlete dashboard summary: {str(e)}")
