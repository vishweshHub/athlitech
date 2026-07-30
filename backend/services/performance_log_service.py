import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException

from core.permissions import normalize_role
from repositories.performance_log_repository import performance_log_repository
from repositories.workout_session_repository import workout_session_repository
from repositories.workout_assignment_repository import workout_assignment_repository
from repositories.metric_definition_repository import metric_definition_repository
from repositories.athlete_repository import athlete_repository
from schemas.performance_log_schema import (
    PerformanceLogCreate,
    PerformanceLogResponse,
)


def _normalize_source_type(st: Optional[str]) -> str:
    if hasattr(st, "value"):
        st = getattr(st, "value")
    norm = str(st or "").strip().upper()
    if norm in ["COACH_PLAN", "PLANNED", "COACH", "COACH PLAN", "COACH_ASSIGNED"]:
        return "COACH_PLAN"
    return "SELF_WORKOUT"


def _format_performance_log_response(log: dict) -> PerformanceLogResponse:
    log_id = str(log.get("id") or log.get("_id"))
    now = datetime.utcnow()

    completed_at = log.get("completed_at") or log.get("recorded_at") or log.get("created_at")
    if not isinstance(completed_at, datetime):
        completed_at = now

    created_at = log.get("created_at")
    if not isinstance(created_at, datetime):
        created_at = now

    updated_at = log.get("updated_at")
    if not isinstance(updated_at, datetime):
        updated_at = now

    workout_name = str(log.get("workout_name") or log.get("activity_label") or "Workout Session")

    return PerformanceLogResponse(
        id=log_id,
        workout_session_id=str(log.get("workout_session_id", "")),
        workout_template_id=log.get("workout_template_id"),
        assignment_id=log.get("assignment_id"),
        athlete_id=str(log.get("athlete_id", "")),
        source_type=_normalize_source_type(log.get("source_type")),
        workout_name=workout_name,
        activity_label=log.get("activity_label") or workout_name,
        metrics=log.get("metrics"),
        completed_at=completed_at,
        duration_minutes=int(log.get("duration_minutes") or 0),
        perceived_effort=int(log.get("perceived_effort") or 5),
        completion_rating=int(log.get("completion_rating") or 5),
        notes=log.get("notes"),
        is_personal_record=bool(log.get("is_personal_record", False)),
        created_at=created_at,
        updated_at=updated_at,
    )


async def _verify_athlete_log_access(athlete_id: str, current_user: dict, require_write: bool = False):
    role = normalize_role(current_user.get("role"))
    user_id = str(current_user.get("id"))

    if role == "admin":
        return

    if role == "athlete":
        if athlete_id != user_id:
            raise HTTPException(status_code=403, detail="Athletes can only manage their own performance logs")

    elif role == "coach":
        ath_doc = await athlete_repository.find_by_id(athlete_id)
        if not ath_doc or str(ath_doc.get("coach_id")) != user_id:
            raise HTTPException(status_code=403, detail="Coaches can only access performance logs for assigned athletes")


async def _evaluate_personal_record(athlete_id: str, metrics: dict) -> bool:
    if not metrics:
        return False

    is_pr = False
    for key, val in metrics.items():
        if not isinstance(val, (int, float)):
            continue

        metric_def = await metric_definition_repository.find_metric_definition_by_key(key)
        better_dir = metric_def.get("better_direction", "higher") if metric_def else None

        if not better_dir:
            if key.lower() in ["time", "duration", "latency"]:
                better_dir = "lower"
            else:
                better_dir = "higher"

        historical_logs = await performance_log_repository.get_athlete_historical_logs_for_metric(athlete_id, key)
        past_values = []
        for hl in historical_logs:
            m_val = hl.get("metrics", {}).get(key)
            if isinstance(m_val, (int, float)):
                past_values.append(float(m_val))

        if not past_values:
            is_pr = True
        elif better_dir == "lower" and float(val) < min(past_values):
            is_pr = True
        elif better_dir == "higher" and float(val) > max(past_values):
            is_pr = True

    return is_pr


async def create_performance_log(
    payload: PerformanceLogCreate, current_user: dict
) -> PerformanceLogResponse:
    print(f"[RUNTIME_TRACE] Step 7: Entering create_performance_log for session={payload.workout_session_id}, source={payload.source_type}", flush=True)
    # 1. Validate Workout Session exists
    ws = await workout_session_repository.find_workout_session_by_id(payload.workout_session_id)
    if not ws:
        raise HTTPException(status_code=404, detail=f"Workout Session with ID '{payload.workout_session_id}' does not exist")

    target_assignment_id = payload.assignment_id or ws.get("assignment_id")

    # 2. If assignment_id is provided, validate it exists
    if target_assignment_id:
        assign = await workout_assignment_repository.find_assignment_by_id(target_assignment_id)
        if not assign and payload.assignment_id:
            raise HTTPException(status_code=404, detail=f"Workout Assignment with ID '{target_assignment_id}' does not exist")

    target_athlete_id = str(ws.get("athlete_id", ""))
    await _verify_athlete_log_access(target_athlete_id, current_user, require_write=True)

    # 3. Check for duplicate performance log for this workout session
    if target_assignment_id:
        existing = await performance_log_repository.find_log_by_session_and_assignment(
            payload.workout_session_id, target_assignment_id
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Performance log already exists for this workout assignment in this workout session"
            )
    else:
        existing = await performance_log_repository.find_log_by_session_id(payload.workout_session_id)
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Athlete can only create one performance log per completed workout session"
            )

    # 4. Evaluate Personal Record (PR) if metrics provided
    is_pr = False
    if payload.metrics:
        is_pr = await _evaluate_personal_record(target_athlete_id, payload.metrics)

    now = datetime.utcnow()
    completed_time = payload.completed_at or payload.recorded_at or ws.get("completed_at") or now

    workout_name = payload.workout_name or payload.activity_label or ws.get("workout_name") or ws.get("title") or "Workout Session"
    source_type = _normalize_source_type(payload.source_type or ws.get("source_type"))

    # Derive duration_minutes
    duration_min = payload.duration_minutes
    if not duration_min or duration_min == 0:
        elapsed = ws.get("elapsed_seconds") or ws.get("duration") or 0
        if isinstance(elapsed, (int, float)) and elapsed > 0:
            duration_min = max(1, int(elapsed // 60))
        else:
            duration_min = 0

    log_doc = {
        "id": str(uuid.uuid4()),
        "workout_session_id": payload.workout_session_id,
        "workout_template_id": payload.workout_template_id or ws.get("workout_template_id"),
        "assignment_id": target_assignment_id,
        "athlete_id": target_athlete_id,
        "source_type": source_type,
        "workout_name": workout_name,
        "activity_label": payload.activity_label or workout_name,
        "completed_at": completed_time,
        "duration_minutes": duration_min,
        "perceived_effort": payload.perceived_effort if payload.perceived_effort is not None else 5,
        "completion_rating": payload.completion_rating if payload.completion_rating is not None else 5,
        "notes": payload.notes,
        "metrics": payload.metrics,
        "is_personal_record": is_pr,
        "recorded_at": completed_time,
        "created_at": now,
        "updated_at": now,
    }

    created = await performance_log_repository.create_performance_log(log_doc)
    return _format_performance_log_response(created)


async def get_performance_log_by_id(log_id: str, current_user: dict) -> PerformanceLogResponse:
    log = await performance_log_repository.find_log_by_id(log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Performance log not found")
    await _verify_athlete_log_access(log.get("athlete_id"), current_user, require_write=False)
    return _format_performance_log_response(log)


async def get_logs_for_workout_session(
    workout_session_id: str, current_user: dict
) -> List[PerformanceLogResponse]:
    ws = await workout_session_repository.find_workout_session_by_id(workout_session_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workout session not found")
    await _verify_athlete_log_access(ws.get("athlete_id"), current_user, require_write=False)

    logs = await performance_log_repository.get_logs_by_workout_session(workout_session_id)
    return [_format_performance_log_response(l) for l in logs]


async def get_logs_for_athlete(
    athlete_id: str, skip: int = 0, limit: int = 100, current_user: Optional[dict] = None
) -> List[PerformanceLogResponse]:
    if current_user:
        await _verify_athlete_log_access(athlete_id, current_user, require_write=False)

    logs = await performance_log_repository.get_logs_by_athlete(athlete_id, skip=skip, limit=limit)
    return [_format_performance_log_response(l) for l in logs]
