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
    role = normalize_role(current_user.get("role"))
    user_id = str(current_user.get("id"))

    if role == "athlete":
        if athlete_id and athlete_id != user_id:
            raise HTTPException(status_code=403, detail="Athletes can only view their own training schedule")
        target_athlete_id = user_id
    elif role == "coach":
        if not athlete_id:
            raise HTTPException(status_code=400, detail="Coaches must specify an athlete_id")
        ath_doc = await athlete_repository.find_by_id(athlete_id)
        if not ath_doc or str(ath_doc.get("coach_id")) != user_id:
            raise HTTPException(status_code=403, detail="Coaches can only view training for their assigned athletes")
        target_athlete_id = athlete_id
    else:  # admin
        target_athlete_id = athlete_id or user_id

    today_str = target_date or datetime.now().strftime("%Y-%m-%d")

    # 1. Primary Source of Truth for Version 1: db["workouts"]
    assigned_workouts = await workout_repository.get_by_athlete(target_athlete_id)
    active_workouts = []

    for w in assigned_workouts:
        w_status = str(w.get("status") or "pending").lower().strip()
        w_date = str(w.get("date") or today_str).strip()

        # BUSINESS RULES:
        # - SKIPPED workouts remain in Today's Training every day until completed or cancelled
        # - PENDING / ACTIVE workouts show if date <= today_str
        # - COMPLETED / CANCELLED workouts disappear immediately
        if w_status == "skipped":
            active_workouts.append(w)
        elif w_status in ["pending", "active"]:
            if w_date <= today_str:
                active_workouts.append(w)

    if active_workouts:
        formatted_assignments = []
        for idx, w in enumerate(active_workouts, 1):
            w_id = str(w.get("workout_id") or w.get("id") or w.get("_id"))
            exercises = w.get("exercises") or []
            exercise_names = [ex.get("name") for ex in exercises if isinstance(ex, dict) and ex.get("name")]
            instr = w.get("description") or (", ".join(exercise_names) if exercise_names else "Assigned Workout")

            wt_id = str(w.get("workout_template_id") or w_id)
            template_doc = None
            if w.get("workout_template_id"):
                try:
                    template_doc = await workout_repository.find_template_by_id(w.get("workout_template_id"))
                except Exception:
                    template_doc = None

            sport = str(w.get("sport") or (template_doc.get("sport") if template_doc else None) or "General Athletics")
            category = str(w.get("category") or (template_doc.get("category") if template_doc else None) or "Main Workout")
            difficulty = str(w.get("difficulty") or (template_doc.get("difficulty") if template_doc else None) or "Intermediate")
            duration = w.get("duration_minutes") or (template_doc.get("duration_minutes") if template_doc else 45)
            equipment = w.get("equipment") or (template_doc.get("equipment") if template_doc else [])

            template_info = TemplateInfoResponse(
                id=w_id,
                title=str(w.get("title") or (template_doc.get("title") if template_doc else None) or "Assigned Workout"),
                sport=sport,
                category=category,
                difficulty=difficulty,
                duration_minutes=duration,
                equipment=equipment,
                instructions=instr,
            )
            formatted_assignments.append(
                TodayAssignmentResponse(
                    id=w_id,
                    workout_template_id=wt_id,
                    category="main",
                    order=idx,
                    assignment_note=w.get("description") or w.get("athlete_notes"),
                    overrides={
                        "status": w.get("status"),
                        "exercises": exercises,
                        "workout_id": w_id,
                    },
                    workout_template=template_info,
                )
            )

        single_session = TodaySessionResponse(
            id=f"session_assigned_{target_athlete_id}",
            session_name=active_workouts[0].get("title") or "Coach Assigned Workout",
            order=1,
            start_time="09:00",
            end_time="10:00",
            assignments=formatted_assignments,
        )

        plan_summary = TodayPlanSummary(
            id=f"plan_assigned_{target_athlete_id}",
            title="Coach Assigned Training Plan",
            goal="Performance Optimization",
            status="active",
        )
        week_summary = TodayWeekSummary(
            id=f"week_{today_str}",
            week_number=1,
            phase_tag="Active Training",
            title="Assigned Phase",
        )
        day_summary = TodayDaySummary(
            id=f"day_{today_str}",
            date=today_str,
            day_name="Scheduled Day",
            day_type="Training",
            notes="Follow assigned coach instructions.",
        )

        return TodayTrainingResponse(
            has_training=True,
            status="NOT_STARTED",
            message="Today's training schedule retrieved successfully from active coach assignments",
            training_plan=plan_summary,
            training_week=week_summary,
            training_day=day_summary,
            sessions=[single_session],
        )

    # 2. Fallback Macrocycle Active Plan Lookup
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
