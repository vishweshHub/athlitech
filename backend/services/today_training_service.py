from datetime import datetime
from typing import Optional
from fastapi import HTTPException

from core.permissions import normalize_role
from repositories.training_plan_repository import training_plan_repository
from repositories.session_repository import session_repository
from repositories.workout_assignment_repository import workout_assignment_repository
from repositories.workout_repository import workout_repository
from repositories.athlete_repository import athlete_repository
from schemas.today_training_schema import (
    TodayTrainingResponse,
    TodayPlanSummary,
    TodayWeekSummary,
    TodayDaySummary,
    TodaySessionResponse,
    TodayAssignmentResponse,
    TemplateInfoResponse,
)


async def get_today_training(
    current_user: dict,
    athlete_id: Optional[str] = None,
    target_date: Optional[str] = None,
) -> TodayTrainingResponse:
    active_roles = current_user.get("active_roles", set())
    user_role = normalize_role(current_user.get("role", "athlete"))
    user_id = str(current_user.get("id"))
    account_id = str(current_user.get("account_id") or user_id)

    if "athlete" in active_roles or user_role == "athlete":
        if athlete_id and athlete_id != user_id and athlete_id != account_id:
            raise HTTPException(status_code=403, detail="Athletes can only view their own training schedule")
        target_athlete_id = user_id
    elif "coach" in active_roles or user_role == "coach":
        if not athlete_id:
            raise HTTPException(status_code=400, detail="Coaches must specify an athlete_id")
        ath_doc = await athlete_repository.find_by_id(athlete_id)
        if not ath_doc or str(ath_doc.get("coach_id")) != user_id:
            raise HTTPException(status_code=403, detail="Coaches can only view training for their assigned athletes")
        target_athlete_id = athlete_id
    else:  # admin
        target_athlete_id = athlete_id or user_id

    today_str = target_date or datetime.now().strftime("%Y-%m-%d")

    # 1. Active Plan Lookup
    plans = await training_plan_repository.get_plans(query_filter={"athlete_id": target_athlete_id, "status": "active"})
    if not plans:
        return TodayTrainingResponse(
            has_training=False,
            status="NO_PLAN",
            message="No active training plan found for athlete",
        )
    active_plan = plans[0]
    plan_summary = TodayPlanSummary(
        id=str(active_plan.get("id") or active_plan.get("_id")),
        title=str(active_plan.get("title", "")),
        goal=str(active_plan.get("goal", "")),
        status=str(active_plan.get("status", "active")),
    )

    # 2. Week and Day Lookup
    weeks = await training_plan_repository.get_weeks_by_plan(plan_summary.id)
    target_week = None
    target_day = None

    for week in weeks:
        days = await training_plan_repository.get_days_by_week(week.get("id"))
        for day in days:
            if day.get("date") == today_str:
                target_week = week
                target_day = day
                break
        if target_day:
            break

    if not target_day or not target_week:
        return TodayTrainingResponse(
            has_training=False,
            status="NO_SCHEDULED_DAY",
            message=f"No training day scheduled for date '{today_str}'",
            training_plan=plan_summary,
        )

    week_summary = TodayWeekSummary(
        id=str(target_week.get("id") or target_week.get("_id")),
        week_number=int(target_week.get("week_number", 1)),
        phase_tag=str(target_week.get("phase_tag", "Base")),
        title=str(target_week.get("title", "")),
    )

    day_summary = TodayDaySummary(
        id=str(target_day.get("id") or target_day.get("_id")),
        date=str(target_day.get("date", "")),
        day_name=str(target_day.get("day_name", "")),
        day_type=str(target_day.get("day_type", "Training")),
        notes=target_day.get("notes"),
    )

    # 3. Check Rest Day
    if target_day.get("day_type") == "Rest":
        return TodayTrainingResponse(
            has_training=False,
            status="REST_DAY",
            message="Today is a Rest day",
            training_plan=plan_summary,
            training_week=week_summary,
            training_day=day_summary,
            sessions=[],
        )

    # 4. Aggregate Sessions and Assignments
    sessions_docs = await session_repository.get_sessions_by_day(day_summary.id)
    formatted_sessions = []

    for sess in sessions_docs:
        sess_id = str(sess.get("id") or sess.get("_id"))
        assignments_docs = await workout_assignment_repository.get_assignments_by_session(sess_id)
        formatted_assignments = []

        for assign in assignments_docs:
            assign_id = str(assign.get("id") or assign.get("_id"))
            wt_id = str(assign.get("workout_template_id", ""))
            template_doc = await workout_repository.find_template_by_id(wt_id)
            template_info = None

            if template_doc:
                template_info = TemplateInfoResponse(
                    id=str(template_doc.get("id") or template_doc.get("workout_id") or template_doc.get("_id")),
                    title=str(template_doc.get("title", "")),
                    sport=str(template_doc.get("sport", "")),
                    category=str(template_doc.get("category", "")),
                    difficulty=str(template_doc.get("difficulty", "")),
                    duration_minutes=template_doc.get("duration_minutes"),
                    equipment=template_doc.get("equipment") or [],
                    instructions=template_doc.get("instructions"),
                )

            formatted_assignments.append(
                TodayAssignmentResponse(
                    id=assign_id,
                    workout_template_id=wt_id,
                    category=str(assign.get("category", "main")),
                    order=int(assign.get("order", 1)),
                    assignment_note=assign.get("assignment_note"),
                    overrides=assign.get("overrides") or {},
                    workout_template=template_info,
                )
            )

        formatted_sessions.append(
            TodaySessionResponse(
                id=sess_id,
                session_name=str(sess.get("session_name", "")),
                order=int(sess.get("order", 1)),
                start_time=sess.get("start_time"),
                end_time=sess.get("end_time"),
                assignments=formatted_assignments,
            )
        )

    return TodayTrainingResponse(
        has_training=True,
        status="NOT_STARTED",
        message="Today's training schedule retrieved successfully",
        training_plan=plan_summary,
        training_week=week_summary,
        training_day=day_summary,
        sessions=formatted_sessions,
    )
