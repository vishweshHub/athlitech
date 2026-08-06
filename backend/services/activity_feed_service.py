from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException

from core.permissions import normalize_role
from core.utils import get_utc_now
from repositories.workout_session_repository import workout_session_repository
from repositories.performance_log_repository import performance_log_repository
from repositories.metric_definition_repository import metric_definition_repository
from repositories.session_repository import session_repository
from repositories.workout_assignment_repository import workout_assignment_repository
from repositories.workout_repository import workout_repository
from repositories.athlete_repository import athlete_repository
from schemas.activity_feed_schema import (
    HeadlineMetric,
    ActivityFeedSessionCard,
    ActivityFeedDayGroup,
    ActivityFeedResponse,
)


async def _resolve_athlete_id(current_user: dict, athlete_id: Optional[str] = None) -> str:
    role = normalize_role(current_user.get("role"))
    user_id = str(current_user.get("id"))

    if role == "athlete":
        if athlete_id and athlete_id != user_id:
            raise HTTPException(status_code=403, detail="Athletes can only view their own activity feed")
        return user_id

    elif role == "coach":
        if not athlete_id:
            raise HTTPException(status_code=400, detail="Coaches must specify an athlete_id")
        ath_doc = await athlete_repository.find_by_id(athlete_id)
        if not ath_doc or str(ath_doc.get("coach_id")) != user_id:
            raise HTTPException(status_code=403, detail="Coaches can only view activity feed for assigned athletes")
        return athlete_id

    else:  # admin
        return athlete_id or user_id


async def get_athlete_activity_feed(
    current_user: dict,
    athlete_id: Optional[str] = None,
    cursor: Optional[str] = None,
    limit: int = 10,
) -> ActivityFeedResponse:
    target_athlete_id = await _resolve_athlete_id(current_user, athlete_id)

    # 1. Parse cursor timestamp if provided
    cursor_dt = None
    if cursor:
        try:
            cursor_dt = datetime.fromisoformat(cursor)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid cursor format. Expected ISO timestamp string.")

    # 2. Query Workout Sessions sorted by started_at descending
    query = {"athlete_id": target_athlete_id}
    if cursor_dt:
        query["started_at"] = {"$lt": cursor_dt}

    cursor_obj = workout_session_repository.collection.find(query).sort("started_at", -1).limit(limit + 1)
    sessions = []
    async for ws in cursor_obj:
        sessions.append(ws)

    has_more = len(sessions) > limit
    page_sessions = sessions[:limit]

    if not page_sessions:
        return ActivityFeedResponse(days=[], next_cursor=None)

    next_cursor = None
    if has_more:
        last_dt = page_sessions[-1].get("started_at")
        if isinstance(last_dt, datetime):
            next_cursor = last_dt.isoformat()

    # 3. Process sessions into cards and group by calendar day
    day_groups_dict = {}
    day_order = []

    for ws in page_sessions:
        started_at = ws.get("started_at")
        if isinstance(started_at, datetime):
            date_str = started_at.strftime("%Y-%m-%d")
        else:
            date_str = get_utc_now().strftime("%Y-%m-%d")

        if date_str not in day_groups_dict:
            day_groups_dict[date_str] = []
            day_order.append(date_str)

        ws_id = str(ws.get("id") or ws.get("_id"))
        planned_session_id = str(ws.get("session_id", ""))

        # Resolve title & sport
        title = "Workout Session"
        sport = "General"
        if planned_session_id:
            sess_doc = await session_repository.find_session_by_id(planned_session_id)
            if sess_doc:
                title = sess_doc.get("session_name", "Workout Session")

            assignments = await workout_assignment_repository.get_assignments_by_session(planned_session_id)
            if assignments:
                first_assign = assignments[0]
                wt_id = first_assign.get("workout_template_id")
                if wt_id:
                    wt_doc = await workout_repository.find_template_by_id(wt_id)
                    if wt_doc:
                        sport = wt_doc.get("sport", "General")

        # Duration
        dur_seconds = int(ws.get("total_duration_seconds", 0))
        dur_minutes = max(0, round(dur_seconds / 60))

        # Performance Logs -> Headline Metrics & Badges
        logs = await performance_log_repository.get_logs_by_workout_session(ws_id)
        headline_metrics = []
        badges_set = set()

        for l in logs:
            if l.get("is_personal_record"):
                badges_set.add("Personal Record")
            if l.get("source_type") == "coach":
                badges_set.add("Coach Logged")

            metrics_dict = l.get("metrics") or {}
            for k, v in metrics_dict.items():
                if len(headline_metrics) < 3:
                    metric_def = await metric_definition_repository.find_metric_definition_by_key(k)
                    label = metric_def.get("display_name", k.replace("_", " ").title()) if metric_def else k.replace("_", " ").title()
                    unit = metric_def.get("unit", "") if metric_def else ""
                    headline_metrics.append(HeadlineMetric(label=label, value=v, unit=unit))

        card = ActivityFeedSessionCard(
            workout_session_id=ws_id,
            title=title,
            sport=sport,
            status=str(ws.get("status", "not_started")),
            completion_percentage=float(ws.get("completion_percentage", 0.0)),
            duration_minutes=dur_minutes,
            headline_metrics=headline_metrics,
            badges=sorted(list(badges_set)),
        )

        day_groups_dict[date_str].append(card)

    # 4. Construct Day Groups with gap_days_before
    days_response = []
    for i, d_str in enumerate(day_order):
        cards = day_groups_dict[d_str]
        completed_count = sum(1 for c in cards if c.status == "completed")
        planned_count = len(cards)

        gap_days = 0
        if i > 0:
            prev_dt = datetime.strptime(day_order[i - 1], "%Y-%m-%d")
            curr_dt = datetime.strptime(d_str, "%Y-%m-%d")
            gap = (prev_dt - curr_dt).days - 1
            gap_days = max(0, gap)

        days_response.append(
            ActivityFeedDayGroup(
                date=d_str,
                gap_days_before=gap_days,
                sessions_completed=completed_count,
                sessions_planned=planned_count,
                sessions=cards,
            )
        )

    return ActivityFeedResponse(days=days_response, next_cursor=next_cursor)
