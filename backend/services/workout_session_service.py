import uuid
from datetime import datetime
from typing import Optional
from fastapi import HTTPException

from core.permissions import normalize_role
from repositories.workout_session_repository import workout_session_repository
from repositories.session_repository import session_repository
from repositories.training_plan_repository import training_plan_repository
from repositories.athlete_repository import athlete_repository
from services.training_plan_service import _verify_plan_access
from schemas.workout_session_schema import (
    WorkoutSessionStartRequest,
    WorkoutSessionCompleteRequest,
    WorkoutSessionCancelRequest,
    WorkoutSessionResponse,
)


def _format_workout_session_response(ws: dict) -> WorkoutSessionResponse:
    ws_id = str(ws.get("id") or ws.get("_id"))
    return WorkoutSessionResponse(
        id=ws_id,
        session_id=str(ws.get("session_id", "")),
        athlete_id=str(ws.get("athlete_id", "")),
        status=str(ws.get("status", "not_started")),
        started_at=ws.get("started_at") if isinstance(ws.get("started_at"), datetime) else datetime.utcnow(),
        paused_at=ws.get("paused_at") if isinstance(ws.get("paused_at"), datetime) else None,
        resumed_at=ws.get("resumed_at") if isinstance(ws.get("resumed_at"), datetime) else None,
        completed_at=ws.get("completed_at") if isinstance(ws.get("completed_at"), datetime) else None,
        total_duration_seconds=int(ws.get("total_duration_seconds", 0)),
        completion_percentage=float(ws.get("completion_percentage", 0.0)),
        session_notes=ws.get("session_notes"),
        created_at=ws.get("created_at") if isinstance(ws.get("created_at"), datetime) else datetime.utcnow(),
        updated_at=ws.get("updated_at") if isinstance(ws.get("updated_at"), datetime) else datetime.utcnow(),
    )


async def _verify_session_read_and_write(ws: dict, current_user: dict, require_write: bool = False):
    role = normalize_role(current_user.get("role"))
    user_id = str(current_user.get("id"))
    athlete_id = str(ws.get("athlete_id", ""))

    if role == "admin":
        return

    if role == "athlete":
        if athlete_id != user_id:
            raise HTTPException(status_code=403, detail="Athletes can only manage their own workout sessions")

    elif role == "coach":
        if require_write:
            raise HTTPException(status_code=403, detail="Coaches have read-only access to athlete workout sessions")
        ath_doc = await athlete_repository.find_by_id(athlete_id)
        if not ath_doc or str(ath_doc.get("coach_id")) != user_id:
            raise HTTPException(status_code=403, detail="Coaches can only view workout sessions for assigned athletes")


async def start_workout_session(payload: WorkoutSessionStartRequest, current_user: dict) -> WorkoutSessionResponse:
    role = normalize_role(current_user.get("role"))
    user_id = str(current_user.get("id"))

    if role == "coach":
        raise HTTPException(status_code=403, detail="Coaches cannot start workout sessions for athletes")
    
    target_athlete_id = user_id

    # 1. Validate Session exists
    sess = await session_repository.find_session_by_id(payload.session_id)
    if not sess:
        raise HTTPException(status_code=404, detail=f"Session with ID '{payload.session_id}' does not exist")

    # 2. Validate athlete access to parent training plan
    day = await training_plan_repository.find_day_by_id(sess.get("training_day_id"))
    if day:
        week = await training_plan_repository.find_week_by_id(day.get("training_week_id"))
        if week:
            plan = await training_plan_repository.find_plan_by_id(week.get("training_plan_id"))
            if plan:
                await _verify_plan_access(plan, current_user, require_write=True)

    # 3. Check for existing active workout session
    active_ws = await workout_session_repository.find_active_workout_session_by_athlete(target_athlete_id)
    if active_ws:
        raise HTTPException(status_code=400, detail="Athlete already has an active workout session")

    # 4. Create new workout session
    now = datetime.utcnow()
    ws_doc = {
        "id": str(uuid.uuid4()),
        "session_id": payload.session_id,
        "athlete_id": target_athlete_id,
        "status": "in_progress",
        "started_at": now,
        "paused_at": None,
        "resumed_at": None,
        "completed_at": None,
        "total_duration_seconds": 0,
        "completion_percentage": 0.0,
        "session_notes": payload.session_notes,
        "created_at": now,
        "updated_at": now,
    }

    created = await workout_session_repository.create_workout_session(ws_doc)
    return _format_workout_session_response(created)


async def pause_workout_session(workout_session_id: str, current_user: dict) -> WorkoutSessionResponse:
    ws = await workout_session_repository.find_workout_session_by_id(workout_session_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workout session not found")

    await _verify_session_read_and_write(ws, current_user, require_write=True)

    current_status = ws.get("status")
    if current_status != "in_progress":
        raise HTTPException(status_code=400, detail=f"Cannot pause workout session in state '{current_status}'")

    now = datetime.utcnow()
    last_active = ws.get("resumed_at") or ws.get("started_at")
    elapsed = int((now - last_active).total_seconds()) if isinstance(last_active, datetime) else 0
    total_dur = int(ws.get("total_duration_seconds", 0)) + max(0, elapsed)

    changes = {
        "status": "paused",
        "paused_at": now,
        "total_duration_seconds": total_dur,
        "updated_at": now,
    }

    updated = await workout_session_repository.update_workout_session(workout_session_id, changes)
    return _format_workout_session_response(updated)


async def resume_workout_session(workout_session_id: str, current_user: dict) -> WorkoutSessionResponse:
    ws = await workout_session_repository.find_workout_session_by_id(workout_session_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workout session not found")

    await _verify_session_read_and_write(ws, current_user, require_write=True)

    current_status = ws.get("status")
    if current_status != "paused":
        raise HTTPException(status_code=400, detail=f"Cannot resume workout session in state '{current_status}'")

    now = datetime.utcnow()
    changes = {
        "status": "in_progress",
        "resumed_at": now,
        "updated_at": now,
    }

    updated = await workout_session_repository.update_workout_session(workout_session_id, changes)
    return _format_workout_session_response(updated)


async def complete_workout_session(
    workout_session_id: str, payload: WorkoutSessionCompleteRequest, current_user: dict
) -> WorkoutSessionResponse:
    ws = await workout_session_repository.find_workout_session_by_id(workout_session_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workout session not found")

    await _verify_session_read_and_write(ws, current_user, require_write=True)

    current_status = ws.get("status")
    if current_status not in ["in_progress", "paused"]:
        raise HTTPException(status_code=400, detail=f"Cannot complete workout session in state '{current_status}'")

    now = datetime.utcnow()
    total_dur = int(ws.get("total_duration_seconds", 0))
    if current_status == "in_progress":
        last_active = ws.get("resumed_at") or ws.get("started_at")
        if isinstance(last_active, datetime):
            total_dur += max(0, int((now - last_active).total_seconds()))

    completion_pct = payload.completion_percentage if payload.completion_percentage is not None else 100.0

    changes = {
        "status": "completed",
        "completed_at": now,
        "total_duration_seconds": total_dur,
        "completion_percentage": completion_pct,
        "updated_at": now,
    }
    if payload.session_notes:
        changes["session_notes"] = payload.session_notes

    updated = await workout_session_repository.update_workout_session(workout_session_id, changes)
    return _format_workout_session_response(updated)


async def cancel_workout_session(
    workout_session_id: str, payload: WorkoutSessionCancelRequest, current_user: dict
) -> WorkoutSessionResponse:
    ws = await workout_session_repository.find_workout_session_by_id(workout_session_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workout session not found")

    await _verify_session_read_and_write(ws, current_user, require_write=True)

    current_status = ws.get("status")
    if current_status in ["completed", "cancelled"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel workout session in state '{current_status}'")

    now = datetime.utcnow()
    changes = {
        "status": "cancelled",
        "completed_at": now,
        "updated_at": now,
    }
    if payload.session_notes:
        changes["session_notes"] = payload.session_notes

    updated = await workout_session_repository.update_workout_session(workout_session_id, changes)
    return _format_workout_session_response(updated)


async def get_active_workout_session(current_user: dict, athlete_id: Optional[str] = None) -> WorkoutSessionResponse:
    role = normalize_role(current_user.get("role"))
    user_id = str(current_user.get("id"))

    if role == "athlete":
        target_athlete_id = user_id
    elif role == "coach":
        if not athlete_id:
            raise HTTPException(status_code=400, detail="Coaches must specify an athlete_id")
        ath_doc = await athlete_repository.find_by_id(athlete_id)
        if not ath_doc or str(ath_doc.get("coach_id")) != user_id:
            raise HTTPException(status_code=403, detail="Coaches can only view active workout session for assigned athletes")
        target_athlete_id = athlete_id
    else:  # admin
        target_athlete_id = athlete_id or user_id

    ws = await workout_session_repository.find_active_workout_session_by_athlete(target_athlete_id)
    if not ws:
        raise HTTPException(status_code=404, detail="No active workout session found")

    return _format_workout_session_response(ws)


async def get_workout_session_by_id(workout_session_id: str, current_user: dict) -> WorkoutSessionResponse:
    ws = await workout_session_repository.find_workout_session_by_id(workout_session_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workout session not found")

    await _verify_session_read_and_write(ws, current_user, require_write=False)
    return _format_workout_session_response(ws)
