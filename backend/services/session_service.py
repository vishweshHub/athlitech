import uuid
from datetime import datetime
from typing import List
from fastapi import HTTPException

from repositories.session_repository import session_repository
from repositories.training_plan_repository import training_plan_repository
from services.training_plan_service import _verify_plan_access
from schemas.session_schema import (
    SessionCreate,
    SessionUpdate,
    SessionResponse,
)


def _format_session_response(s: dict) -> SessionResponse:
    session_id = str(s.get("id") or s.get("_id"))
    return SessionResponse(
        id=session_id,
        training_day_id=str(s.get("training_day_id", "")),
        session_name=str(s.get("session_name", "")),
        order=int(s.get("order", 1)),
        start_time=s.get("start_time"),
        end_time=s.get("end_time"),
        created_at=s.get("created_at") if isinstance(s.get("created_at"), datetime) else datetime.utcnow(),
        updated_at=s.get("updated_at") if isinstance(s.get("updated_at"), datetime) else datetime.utcnow(),
    )


async def _verify_day_access(day_id: str, current_user: dict, require_write: bool = False) -> dict:
    day = await training_plan_repository.find_day_by_id(day_id)
    if not day:
        raise HTTPException(status_code=404, detail=f"Training Day with ID '{day_id}' does not exist")
    week = await training_plan_repository.find_week_by_id(day.get("training_week_id"))
    if week:
        plan = await training_plan_repository.find_plan_by_id(week.get("training_plan_id"))
        if plan:
            await _verify_plan_access(plan, current_user, require_write=require_write)
    return day


async def create_session(payload: SessionCreate, current_user: dict) -> SessionResponse:
    await _verify_day_access(payload.training_day_id, current_user, require_write=True)

    # Prevent duplicate order values within the same Training Day
    existing = await session_repository.find_session_by_day_and_order(payload.training_day_id, payload.order)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Session with order {payload.order} already exists for this Training Day"
        )

    session_doc = {
        "id": str(uuid.uuid4()),
        "training_day_id": payload.training_day_id,
        "session_name": payload.session_name,
        "order": payload.order,
        "start_time": payload.start_time,
        "end_time": payload.end_time,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    created = await session_repository.create_session(session_doc)
    return _format_session_response(created)


async def get_sessions_for_day(day_id: str, current_user: dict) -> List[SessionResponse]:
    await _verify_day_access(day_id, current_user, require_write=False)
    sessions = await session_repository.get_sessions_by_day(day_id)
    return [_format_session_response(s) for s in sessions]


async def get_session_by_id(session_id: str, current_user: dict) -> SessionResponse:
    session = await session_repository.find_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await _verify_day_access(session.get("training_day_id"), current_user, require_write=False)
    return _format_session_response(session)


async def update_session(session_id: str, payload: SessionUpdate, current_user: dict) -> SessionResponse:
    session = await session_repository.find_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    await _verify_day_access(session.get("training_day_id"), current_user, require_write=True)

    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        return _format_session_response(session)

    if "order" in changes and changes["order"] != session.get("order"):
        existing = await session_repository.find_session_by_day_and_order(
            session.get("training_day_id"), changes["order"]
        )
        if existing and str(existing.get("id") or existing.get("_id")) != session_id:
            raise HTTPException(
                status_code=400,
                detail=f"Session with order {changes['order']} already exists for this Training Day"
            )

    changes["updated_at"] = datetime.utcnow()
    updated = await session_repository.update_session(session_id, changes)
    return _format_session_response(updated)


async def delete_session(session_id: str, current_user: dict) -> dict:
    session = await session_repository.find_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    await _verify_day_access(session.get("training_day_id"), current_user, require_write=True)

    deleted = await session_repository.delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=500, detail="Failed to delete session")
    return {"message": "Session deleted successfully", "id": session_id}
