import uuid
from datetime import datetime
from typing import Optional
from fastapi import HTTPException, status

from core.permissions import normalize_role
from repositories.workout_session_repository import workout_session_repository
from repositories.session_repository import session_repository
from repositories.training_plan_repository import training_plan_repository
from repositories.athlete_repository import athlete_repository
from repositories.workout_repository import workout_repository
from repositories.workout_assignment_repository import workout_assignment_repository
from repositories.athlete_saved_workout_repository import athlete_saved_workout_repository
from repositories.performance_log_repository import performance_log_repository
from services.performance_log_service import create_performance_log
from schemas.performance_log_schema import PerformanceLogCreate
from services.training_plan_service import _verify_plan_access
from schemas.workout_session_schema import (
    WorkoutSessionStartRequest,
    WorkoutSessionCompleteRequest,
    WorkoutSessionCancelRequest,
    WorkoutSessionResponse,
)


def _format_workout_session_response(ws: dict) -> WorkoutSessionResponse:
    ws_id = str(ws.get("id") or ws.get("_id"))
    session_id_val = str(ws.get("session_id")) if ws.get("session_id") else None
    template_id_val = str(ws.get("workout_template_id")) if ws.get("workout_template_id") else None
    assignment_id_val = str(ws.get("assignment_id")) if ws.get("assignment_id") else None

    return WorkoutSessionResponse(
        id=ws_id,
        session_id=session_id_val,
        workout_template_id=template_id_val,
        assignment_id=assignment_id_val,
        athlete_id=str(ws.get("athlete_id", "")),
        source_type=str(ws.get("source_type", "PLANNED")),
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

    session_id = payload.session_id
    template_id = payload.workout_template_id
    explicit_assignment_id = payload.assignment_id

    if (session_id and template_id) or (not session_id and not template_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exactly one of 'session_id' or 'workout_template_id' must be provided.",
        )

    # Check for existing active workout session
    active_ws = await workout_session_repository.find_active_workout_session_by_athlete(target_athlete_id)
    if active_ws:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Athlete already has an active workout session")

    source_type = "PLANNED"
    final_session_id = None
    final_template_id = None
    final_assignment_id = explicit_assignment_id

    if session_id:
        # Flow A: Planned Session or Coach-Assigned Workout
        sess = await session_repository.find_session_by_id(session_id)
        if not sess:
            target_workout_id = explicit_assignment_id or payload.assignment_id
            assigned_w = None
            if target_workout_id:
                assigned_w = await workout_repository.find_by_workout_id(target_workout_id)
                if not assigned_w:
                    assigned_w = await workout_repository.find_template_by_id(target_workout_id)

            if not assigned_w:
                athlete_workouts = await workout_repository.get_by_athlete(target_athlete_id)
                if athlete_workouts:
                    assigned_w = athlete_workouts[0]

            if assigned_w:
                final_session_id = session_id
                final_template_id = str(assigned_w.get("workout_template_id") or assigned_w.get("id") or session_id)
                final_assignment_id = str(assigned_w.get("id") or explicit_assignment_id or session_id)
                source_type = "PLANNED"
            else:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Session with ID '{session_id}' does not exist")
        else:
            day = await training_plan_repository.find_day_by_id(sess.get("training_day_id"))
            if day:
                week = await training_plan_repository.find_week_by_id(day.get("training_week_id"))
                if week:
                    plan = await training_plan_repository.find_plan_by_id(week.get("training_plan_id"))
                    if plan:
                        await _verify_plan_access(plan, current_user, require_write=True)

            final_session_id = session_id
            source_type = "PLANNED"

            if not final_assignment_id:
                assigns = await workout_assignment_repository.get_assignments_by_session(session_id)
                if assigns and len(assigns) > 0:
                    final_assignment_id = str(assigns[0].get("id") or assigns[0].get("_id"))

    else:
        # Flow B: Self Workout or Coach-Assigned Template
        tmpl = await workout_repository.find_template_by_id(template_id)
        if not tmpl:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Workout template with ID '{template_id}' does not exist")

        assigned_workouts = await workout_repository.get_by_athlete(target_athlete_id)
        is_assigned = any(
            str(w.get("workout_template_id")) == template_id or str(w.get("workout_id")) == template_id or str(w.get("id")) == template_id
            for w in assigned_workouts
        )

        if not is_assigned:
            saved_item = await athlete_saved_workout_repository.find_by_athlete_and_template(
                athlete_id=target_athlete_id,
                workout_template_id=template_id,
            )
            if not saved_item:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Athlete has not saved this workout template to their collection.",
                )

        final_template_id = template_id
        source_type = "PLANNED" if is_assigned else "SELF"

    # Create new workout session
    now = datetime.utcnow()
    ws_doc = {
        "id": str(uuid.uuid4()),
        "session_id": final_session_id,
        "workout_template_id": final_template_id,
        "assignment_id": final_assignment_id,
        "athlete_id": target_athlete_id,
        "source_type": source_type,
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

    existing_log = await performance_log_repository.find_log_by_session_id(workout_session_id)
    if not existing_log:
        raw_source = ws.get("source_type") or "SELF_WORKOUT"
        norm_source = str(raw_source).strip().upper()
        source_type = "COACH_PLAN" if norm_source in ["COACH_PLAN", "PLANNED", "COACH", "COACH PLAN", "COACH_ASSIGNED"] else "SELF_WORKOUT"
        duration_mins = max(1, int(total_dur // 60)) if total_dur > 0 else 30

        log_payload = PerformanceLogCreate(
            workout_session_id=workout_session_id,
            workout_template_id=ws.get("workout_template_id"),
            assignment_id=ws.get("assignment_id"),
            source_type=source_type,
            workout_name=ws.get("workout_name") or ws.get("title") or "Workout Session",
            activity_label=ws.get("workout_name") or ws.get("title") or "Workout Session",
            duration_minutes=duration_mins,
            perceived_effort=5,
            completion_rating=5,
            notes=payload.session_notes,
        )
        await create_performance_log(log_payload, current_user)

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
