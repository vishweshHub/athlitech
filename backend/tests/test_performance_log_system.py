import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from bson.objectid import ObjectId

from main import app
from services.auth_service import get_current_user


class FakeResult:
    def __init__(self, matched=1, modified=1, deleted=1):
        self.matched_count = matched
        self.modified_count = modified
        self.deleted_count = deleted


class FakeCollection:
    def __init__(self, initial=None):
        self.data = initial or {}

    async def find_one(self, query):
        if "$or" in query:
            for subq in query["$or"]:
                res = await self._find_one_sub(subq)
                if res:
                    return res
            return None
        return await self._find_one_sub(query)

    async def _find_one_sub(self, query):
        for v in list(self.data.values()):
            match = True
            for k, val in query.items():
                if k == "_id" and isinstance(val, ObjectId):
                    if str(v.get(k)) != str(val):
                        match = False
                        break
                elif k == "status" and isinstance(val, dict) and "$in" in val:
                    if v.get(k) not in val["$in"]:
                        match = False
                        break
                elif k.startswith("metrics.") and "$exists" in val:
                    m_key = k.split(".")[1]
                    if m_key not in v.get("metrics", {}):
                        match = False
                        break
                elif v.get(k) != val:
                    match = False
                    break
            if match:
                return v
        return None

    async def update_one(self, query, update):
        target = await self.find_one(query)
        if target:
            set_ops = update.get("$set", {})
            target.update(set_ops)
            return FakeResult(matched=1, modified=1)
        return FakeResult(matched=0, modified=0)

    async def delete_one(self, query):
        target = await self.find_one(query)
        if target:
            key = target.get("id") or str(target.get("_id"))
            if key in self.data:
                del self.data[key]
                return FakeResult(deleted=1)
        return FakeResult(deleted=0)

    async def delete_many(self, query):
        keys_to_del = []
        for k, v in list(self.data.items()):
            match = True
            for qk, qv in query.items():
                if v.get(qk) != qv:
                    match = False
                    break
            if match:
                keys_to_del.append(k)
        for k in keys_to_del:
            del self.data[k]
        return FakeResult(deleted=len(keys_to_del))

    async def insert_one(self, document):
        if "_id" not in document:
            document["_id"] = str(ObjectId())
        key = document.get("id") or document.get("workout_id") or str(document["_id"])
        self.data[key] = document
        return document

    def find(self, query=None):
        query = query or {}

        class Cursor:
            def __init__(self, data_list):
                self.items = data_list

            def skip(self, n):
                self.items = self.items[n:]
                return self

            def limit(self, n):
                self.items = self.items[:n]
                return self

            def sort(self, key, direction=1):
                def sort_val(x):
                    v = x.get(key)
                    if isinstance(v, datetime):
                        return v.timestamp()
                    return v or 0
                self.items.sort(key=sort_val, reverse=(direction == -1))
                return self

            def __aiter__(self):
                self._iter = iter(self.items)
                return self

            async def __anext__(self):
                try:
                    return next(self._iter)
                except StopIteration:
                    raise StopAsyncIteration

        matched_list = []
        for v in list(self.data.values()):
            match = True
            if "$or" in query:
                or_match = False
                for subq in query["$or"]:
                    sub_match = True
                    for k, val in subq.items():
                        if isinstance(val, dict) and "$in" in val:
                            if v.get(k) not in val["$in"]:
                                sub_match = False
                                break
                        elif k.startswith("metrics.") and "$exists" in val:
                            m_key = k.split(".")[1]
                            if m_key not in v.get("metrics", {}):
                                sub_match = False
                                break
                        elif v.get(k) != val:
                            sub_match = False
                            break
                    if sub_match:
                        or_match = True
                        break
                if not or_match:
                    match = False
            else:
                for k, val in query.items():
                    if isinstance(val, dict) and "$in" in val:
                        if v.get(k) not in val["$in"]:
                            match = False
                            break
                    elif k.startswith("metrics.") and "$exists" in val:
                        m_key = k.split(".")[1]
                        if m_key not in v.get("metrics", {}):
                            match = False
                            break
                    elif v.get(k) != val:
                        match = False
                        break
            if match:
                matched_list.append(v)

        return Cursor(matched_list)


def setup_fakes():
    from database import mongodb
    from routes import (
        training_plan_routes,
        session_routes,
        workout_assignment_routes,
        workout_routes,
        today_training_routes,
        workout_session_routes,
        metric_definition_routes,
        performance_log_routes,
    )
    from repositories import (
        training_plan_repository,
        session_repository,
        workout_assignment_repository,
        workout_repository,
        athlete_repository,
        workout_session_repository,
        metric_definition_repository,
        performance_log_repository,
    )

    plans_fake = FakeCollection()
    weeks_fake = FakeCollection()
    days_fake = FakeCollection()
    sessions_fake = FakeCollection()
    assignments_fake = FakeCollection()
    workouts_fake = FakeCollection()
    athletes_fake = FakeCollection()
    ws_fake = FakeCollection()
    metric_defs_fake = FakeCollection()
    performance_logs_fake = FakeCollection()

    mongodb.training_plans_collection = plans_fake
    mongodb.training_weeks_collection = weeks_fake
    mongodb.training_days_collection = days_fake
    mongodb.sessions_collection = sessions_fake
    mongodb.workout_assignments_collection = assignments_fake
    mongodb.workouts_collection = workouts_fake
    mongodb.athletes_collection = athletes_fake
    mongodb.workout_sessions_collection = ws_fake
    mongodb.metric_definitions_collection = metric_defs_fake
    mongodb.performance_logs_collection = performance_logs_fake

    training_plan_routes.training_plans_collection = plans_fake
    training_plan_routes.training_weeks_collection = weeks_fake
    training_plan_routes.training_days_collection = days_fake

    session_routes.sessions_collection = sessions_fake
    workout_assignment_routes.workout_assignments_collection = assignments_fake
    workout_routes.workouts_collection = workouts_fake
    workout_session_routes.workout_sessions_collection = ws_fake
    metric_definition_routes.metric_definitions_collection = metric_defs_fake
    performance_log_routes.performance_logs_collection = performance_logs_fake

    training_plan_repository.training_plan_repository.plans_collection = plans_fake
    training_plan_repository.training_plan_repository.weeks_collection = weeks_fake
    training_plan_repository.training_plan_repository.days_collection = days_fake

    session_repository.session_repository.sessions_collection = sessions_fake
    workout_assignment_repository.workout_assignment_repository.collection = assignments_fake
    workout_repository.workout_repository.collection = workouts_fake
    athlete_repository.athlete_repository.collection = athletes_fake
    workout_session_repository.workout_session_repository.collection = ws_fake
    metric_definition_repository.metric_definition_repository.collection = metric_defs_fake
    performance_log_repository.performance_log_repository.collection = performance_logs_fake

    return metric_defs_fake, performance_logs_fake, workouts_fake, athletes_fake


# Test Users
athlete_1 = {"id": "ath-111", "name": "Athlete One", "email": "athlete1@athlitech.com", "role": "athlete"}
athlete_2 = {"id": "ath-222", "name": "Athlete Two", "email": "athlete2@athlitech.com", "role": "athlete"}
coach_1 = {"id": "coach-111", "name": "Coach One", "email": "coach1@athlitech.com", "role": "coach"}
admin_1 = {"id": "admin-111", "name": "Admin One", "email": "admin1@athlitech.com", "role": "admin"}


def run_tests():
    metric_defs_fake, performance_logs_fake, workouts_fake, athletes_fake = setup_fakes()
    client = TestClient(app)

    print("Running Performance Log & Metric Definition System Unit Test Suite...")

    # Seed coach assignment for athlete 1
    athletes_fake.data["ath-111"] = {
        "id": "ath-111",
        "athlete_id": "ath-111",
        "name": "Athlete One",
        "coach_id": "coach-111"
    }

    # 1. Athlete tries to create Metric Definition -> 403 Forbidden
    app.dependency_overrides[get_current_user] = lambda: athlete_1
    r1 = client.post("/metric-definitions", json={
        "metric_key": "sprint_100m",
        "display_name": "100m Sprint Time",
        "unit": "s",
        "better_direction": "lower"
    })
    assert r1.status_code == 403, f"Expected 403, got {r1.status_code}"
    print("Test 1 Passed: Non-admin forbidden from creating Metric Definition.")

    # 2. Admin creates Metric Definitions
    app.dependency_overrides[get_current_user] = lambda: admin_1
    r2_1 = client.post("/metric-definitions", json={
        "metric_key": "time",
        "display_name": "Sprint Time",
        "unit": "s",
        "better_direction": "lower"
    })
    assert r2_1.status_code == 200

    r2_2 = client.post("/metric-definitions", json={
        "metric_key": "weight",
        "display_name": "Bench Press Weight",
        "unit": "kg",
        "better_direction": "higher"
    })
    assert r2_2.status_code == 200
    print("Test 2 Passed: Admin created Metric Definitions.")

    # 3. Get all Metric Definitions
    app.dependency_overrides[get_current_user] = lambda: athlete_1
    r3 = client.get("/metric-definitions")
    assert r3.status_code == 200
    assert len(r3.json()) == 2
    print("Test 3 Passed: Retrieved all Metric Definitions.")

    # 4. Reject Performance Log for non-existent Workout Session ID
    r4 = client.post("/performance-logs", json={
        "workout_session_id": "non-existent-ws",
        "assignment_id": "assign-123",
        "activity_label": "Flying 30m Sprint",
        "metrics": {"time": 3.95}
    })
    assert r4.status_code == 404
    print("Test 4 Passed: Performance Log for non-existent Workout Session rejected with 404.")

    # Seed Workout Template
    wt_id = "wt-999"
    workouts_fake.data[wt_id] = {
        "id": wt_id,
        "title": "Flying 30m Sprint Template",
        "sport": "Track & Field",
        "category": "Sprint",
        "difficulty": "Advanced"
    }

    # Setup parent hierarchy: Plan -> Week -> Day -> Session -> Assignment -> Workout Session 1
    r_plan = client.post("/training-plans/", json={
        "title": "Speed Plan",
        "goal": "100m Velocity",
        "athlete_id": "ath-111",
        "start_date": "2026-08-01",
        "end_date": "2026-10-31"
    })
    plan_id = r_plan.json()["id"]

    r_week = client.post("/training-plans/weeks/", json={
        "training_plan_id": plan_id,
        "week_number": 1,
        "phase_tag": "Base",
        "title": "Week 1"
    })
    week_id = r_week.json()["id"]

    r_day = client.post("/training-plans/days/", json={
        "training_week_id": week_id,
        "date": "2026-08-01",
        "day_name": "Monday",
        "day_type": "Training"
    })
    day_id = r_day.json()["id"]

    r_sess = client.post("/training-plans/sessions/", json={
        "training_day_id": day_id,
        "session_name": "Morning Track",
        "order": 1
    })
    sess_id = r_sess.json()["id"]

    r_assign = client.post("/training-plans/assignments/", json={
        "session_id": sess_id,
        "workout_template_id": wt_id,
        "category": "main",
        "order": 1
    })
    assign_id = r_assign.json()["id"]

    r_ws1 = client.post("/workout-sessions/start", json={"session_id": sess_id})
    ws1_id = r_ws1.json()["id"]

    # 5. Create first Performance Log -> First benchmark is evaluated as PR (is_personal_record=True)
    r5 = client.post("/performance-logs", json={
        "workout_session_id": ws1_id,
        "assignment_id": assign_id,
        "activity_label": "Flying 30m Sprint",
        "metrics": {"time": 3.90, "weight": 100.0},
        "source_type": "manual",
        "notes": "Felt explosive"
    })
    assert r5.status_code in [200, 201], f"Expected 200/201, got {r5.status_code}: {r5.json()}"
    log1 = r5.json()
    log1_id = log1["id"]
    assert log1["is_personal_record"] is True
    print("Test 5 Passed: First Performance Log created and evaluated as PR=True.")

    # 6. Reject duplicate Performance Log for same assignment in same Workout Session
    r6 = client.post("/performance-logs", json={
        "workout_session_id": ws1_id,
        "assignment_id": assign_id,
        "activity_label": "Flying 30m Sprint Duplicate",
        "metrics": {"time": 3.85}
    })
    assert r6.status_code == 400
    print("Test 6 Passed: Duplicate log for same assignment in same Workout Session rejected with 400.")

    # Complete Workout Session 1
    client.post(f"/workout-sessions/{ws1_id}/complete", json={})

    # Start Workout Session 2 & Log Better Performance -> PR=True
    r_ws2 = client.post("/workout-sessions/start", json={"session_id": sess_id})
    ws2_id = r_ws2.json()["id"]

    r7 = client.post("/performance-logs", json={
        "workout_session_id": ws2_id,
        "assignment_id": assign_id,
        "activity_label": "Flying 30m Sprint",
        "metrics": {"time": 3.80, "weight": 110.0},  # Faster time (3.80 < 3.90) and higher weight (110 > 100)
        "source_type": "wearable"
    })
    assert r7.status_code in [200, 201]
    log2 = r7.json()
    assert log2["is_personal_record"] is True
    print("Test 7 Passed: Better performance correctly evaluated as new PR (is_personal_record=True).")

    # Complete Workout Session 2
    client.post(f"/workout-sessions/{ws2_id}/complete", json={})

    # Start Workout Session 3 & Log Slower Performance -> PR=False
    r_ws3 = client.post("/workout-sessions/start", json={"session_id": sess_id})
    ws3_id = r_ws3.json()["id"]

    r8 = client.post("/performance-logs", json={
        "workout_session_id": ws3_id,
        "assignment_id": assign_id,
        "activity_label": "Flying 30m Sprint",
        "metrics": {"time": 4.05, "weight": 95.0},  # Slower time (4.05 > 3.80) and lower weight (95 < 110)
        "source_type": "manual"
    })
    assert r8.status_code in [200, 201]
    log3 = r8.json()
    assert log3["is_personal_record"] is False
    print("Test 8 Passed: Slower performance correctly evaluated as non-PR (is_personal_record=False).")

    # 9. Get log by ID
    r9 = client.get(f"/performance-logs/{log1_id}")
    assert r9.status_code == 200
    assert r9.json()["id"] == log1_id
    print("Test 9 Passed: Retrieved Performance Log by ID.")

    # 10. Get logs for Workout Session
    r10 = client.get(f"/performance-logs/workout-session/{ws1_id}")
    assert r10.status_code == 200
    assert len(r10.json()) == 1
    print("Test 10 Passed: Retrieved logs for Workout Session.")

    # 11. Get athlete Performance Logs (paginated)
    r11 = client.get("/performance-logs/athlete/ath-111?skip=0&limit=2")
    assert r11.status_code == 200
    assert len(r11.json()) == 2
    print("Test 11 Passed: Retrieved paginated athlete Performance Logs.")

    # 12. Authorization checks
    app.dependency_overrides[get_current_user] = lambda: athlete_2
    r12_ath2 = client.get(f"/performance-logs/{log1_id}")
    assert r12_ath2.status_code == 403
    print("Test 12 Passed: Athlete 2 forbidden from reading Athlete 1's performance logs.")

    app.dependency_overrides[get_current_user] = lambda: coach_1
    r12_coach = client.get(f"/performance-logs/{log1_id}")
    assert r12_coach.status_code == 200
    print("Test 13 Passed: Coach can view assigned athlete's performance logs.")

    app.dependency_overrides[get_current_user] = lambda: admin_1
    r12_admin = client.get(f"/performance-logs/{log1_id}")
    assert r12_admin.status_code == 200
    print("Test 14 Passed: Admin has full access to performance logs.")

    # 15. Verify Assigned Workout Status Update automatically creates Performance Log with source_type COACH_PLAN
    app.dependency_overrides[get_current_user] = lambda: athlete_1
    fake_workout = {
        "id": "work-assigned-999",
        "workout_id": "work-assigned-999",
        "athlete_id": "ath-111",
        "title": "Bench Press Power Plan",
        "status": "pending"
    }
    workouts_fake.data["work-assigned-999"] = fake_workout

    r_status = client.put("/workouts/work-assigned-999/status", json={
        "status": "completed",
        "athlete_notes": "Pushed all sets smoothly"
    })
    assert r_status.status_code == 200

    r_history = client.get("/performance-logs/athlete/ath-111")
    assert r_history.status_code == 200
    logs = r_history.json()
    coach_logs = [l for l in logs if l.get("source_type") == "COACH_PLAN"]
    assert len(coach_logs) >= 1
    assert coach_logs[0]["workout_name"] == "Bench Press Power Plan"
    print("Test 15 Passed: Assigned Workout status update automatically created Performance Log with source_type COACH_PLAN.")

    app.dependency_overrides.clear()
    print("All Performance Log & Metric Definition System Unit Tests Passed Successfully!")


def test_performance_log_suite():
    run_tests()


if __name__ == "__main__":
    run_tests()
