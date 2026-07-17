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
        return await get_admin_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch admin dashboard summary: {str(e)}")

@router.get("/coach/{coach_id}/summary", response_model=CoachSummaryRead, dependencies=[Depends(require_coach_or_admin)])
async def read_coach_summary(coach_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") == "coach":
        coach_doc = await coach_repository.find_by_id(current_user.get("id"))
        resolved_coach_id = coach_doc.get("coach_id") or str(coach_doc["_id"]) if coach_doc else None
        if not coach_doc or resolved_coach_id != coach_id:
            raise HTTPException(status_code=403, detail="Coaches can only view their own dashboard summary")
    
    try:
        return await get_coach_summary(coach_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch coach dashboard summary: {str(e)}")

@router.get("/athlete/{athlete_id}/summary", response_model=AthleteSummaryRead)
async def read_athlete_summary(athlete_id: str, current_user: dict = Depends(get_current_user)):
    role = current_user.get("role")
    
    if role == "admin":
        pass
    elif role == "coach":
        coach_doc = await coach_repository.find_by_id(current_user.get("id"))
        resolved_coach_id = coach_doc.get("coach_id") or str(coach_doc["_id"]) if coach_doc else None
        athlete = await athlete_repository.find_by_id(athlete_id)
        if not athlete or athlete.get("coach_id") != resolved_coach_id:
            raise HTTPException(status_code=403, detail="Coaches can only view summaries of their assigned athletes")
    elif role == "athlete":
        if current_user.get("id") != athlete_id:
            raise HTTPException(status_code=403, detail="Athletes can only view their own dashboard summary")
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
        
    try:
        return await get_athlete_summary(athlete_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch athlete dashboard summary: {str(e)}")
