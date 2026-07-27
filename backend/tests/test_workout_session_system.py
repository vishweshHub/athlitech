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
                self.items.sort(key=lambda x: x.get(key, 0), reverse=(direction == -1))
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
    )
    from repositories import (
        training_plan_repository,
        session_repository,
        workout_assignment_repository,
        workout_repository,
        athlete_repository,
        workout_session_repository,
    )

    plans_fake = FakeCollection()
    weeks_fake = FakeCollection()
    days_fake = FakeCollection()
    sessions_fake = FakeCollection()
    assignments_fake = FakeCollection()
    workouts_fake = FakeCollection()
    athletes_fake = FakeCollection()
    ws_fake = FakeCollection()

    mongodb.training_plans_collection = plans_fake
    mongodb.training_weeks_collection = weeks_fake
    mongodb.training_days_collection = days_fake
    mongodb.sessions_collection = sessions_fake
    mongodb.workout_assignments_collection = assignments_fake
    mongodb.workouts_collection = workouts_fake
    mongodb.athletes_collection = athletes_fake
    mongodb.workout_sessions_collection = ws_fake

    training_plan_routes.training_plans_collection = plans_fake
    training_plan_routes.training_weeks_collection = weeks_fake
    training_plan_routes.training_days_collection = days_fake

    session_routes.sessions_collection = sessions_fake
    workout_assignment_routes.workout_assignments_collection = assignments_fake
    workout_routes.workouts_collection = workouts_fake
    workout_session_routes.workout_sessions_collection = ws_fake

    training_plan_repository.training_plan_repository.plans_collection = plans_fake
    training_plan_repository.training_plan_repository.weeks_collection = weeks_fake
    training_plan_repository.training_plan_repository.days_collection = days_fake

    session_repository.session_repository.sessions_collection = sessions_fake
    workout_assignment_repository.workout_assignment_repository.collection = assignments_fake
    workout_repository.workout_repository.collection = workouts_fake
    athlete_repository.athlete_repository.collection = athletes_fake
    workout_session_repository.workout_session_repository.collection = ws_fake

    return ws_fake, athletes_fake


# Test Users
athlete_1 = {"id": "ath-111", "name": "Athlete One", "email": "athlete1@athlitech.com", "role": "athlete"}
athlete_2 = {"id": "ath-222", "name": "Athlete Two", "email": "athlete2@athlitech.com", "role": "athlete"}
coach_1 = {"id": "coach-111", "name": "Coach One", "email": "coach1@athlitech.com", "role": "coach"}
admin_1 = {"id": "admin-111", "name": "Admin One", "email": "admin1@athlitech.com", "role": "admin"}


def run_tests():
    ws_fake, athletes_fake = setup_fakes()
    client = TestClient(app)

    print("Running Workout Session System Unit Test Suite...")

    # Seed coach assignment
    athletes_fake.data["ath-111"] = {
        "id": "ath-111",
        "athlete_id": "ath-111",
        "name": "Athlete One",
        "coach_id": "coach-111"
    }

    # 1. Reject start workout session for non-existent planned session
    app.dependency_overrides[get_current_user] = lambda: athlete_1
    r1 = client.post("/workout-sessions/start", json={"session_id": "non-existent-session"})
    assert r1.status_code == 404, f"Expected 404, got {r1.status_code}"
    print("Test 1 Passed: Start workout session for non-existent planned session rejected with 404.")

    # Create parent hierarchy: Plan -> Week -> Day -> Session
    r_plan = client.post("/training-plans/", json={
        "title": "Speed Program",
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
        "title": "Week 1: Base"
    })
    week_id = r_week.json()["id"]

    r_day = client.post("/training-plans/days/", json={
        "training_week_id": week_id,
        "date": "2026-08-01",
        "day_name": "Monday",
        "day_type": "Training"
    })
    day_id = r_day.json()["id"]

    r_sess1 = client.post("/training-plans/sessions/", json={
        "training_day_id": day_id,
        "session_name": "Morning Track Session",
        "order": 1
    })
    sess1_id = r_sess1.json()["id"]

    r_sess2 = client.post("/training-plans/sessions/", json={
        "training_day_id": day_id,
        "session_name": "Evening Gym Session",
        "order": 2
    })
    sess2_id = r_sess2.json()["id"]

    # 2. Start Workout Session 1 -> in_progress
    r2 = client.post("/workout-sessions/start", json={
        "session_id": sess1_id,
        "session_notes": "Starting morning block workout"
    })
    assert r2.status_code == 200, f"Expected 200, got {r2.status_code}: {r2.json()}"
    ws1_data = r2.json()
    ws1_id = ws1_data["id"]
    assert ws1_data["status"] == "in_progress"
    assert ws1_data["athlete_id"] == "ath-111"
    print("Test 2 Passed: Started Workout Session 1 with status 'in_progress'.")

    # 3. Reject starting a second active workout session for the same athlete
    r3 = client.post("/workout-sessions/start", json={"session_id": sess2_id})
    assert r3.status_code == 400, f"Expected 400, got {r3.status_code}"
    print("Test 3 Passed: Creating a second active workout session rejected with 400.")

    # 4. Get active workout session
    r4 = client.get("/workout-sessions/active")
    assert r4.status_code == 200
    assert r4.json()["id"] == ws1_id
    assert r4.json()["status"] == "in_progress"
    print("Test 4 Passed: Retrieved active workout session.")

    # 5. Pause Workout Session
    r5 = client.post(f"/workout-sessions/{ws1_id}/pause")
    assert r5.status_code == 200
    assert r5.json()["status"] == "paused"
    print("Test 5 Passed: Paused workout session.")

    # 6. Reject pausing when already paused
    r6 = client.post(f"/workout-sessions/{ws1_id}/pause")
    assert r6.status_code == 400, f"Expected 400, got {r6.status_code}"
    print("Test 6 Passed: Double pause rejected with 400.")

    # 7. Resume Workout Session
    r7 = client.post(f"/workout-sessions/{ws1_id}/resume")
    assert r7.status_code == 200
    assert r7.json()["status"] == "in_progress"
    print("Test 7 Passed: Resumed workout session.")

    # 8. Complete Workout Session
    r8 = client.post(f"/workout-sessions/{ws1_id}/complete", json={
        "completion_percentage": 100.0,
        "session_notes": "Completed all 5 block start reps smoothly"
    })
    assert r8.status_code == 200
    ws1_comp = r8.json()
    assert ws1_comp["status"] == "completed"
    assert ws1_comp["completion_percentage"] == 100.0
    print("Test 8 Passed: Completed workout session.")

    # 9. Reject completing an already completed session
    r9 = client.post(f"/workout-sessions/{ws1_id}/complete", json={})
    assert r9.status_code == 400, f"Expected 400, got {r9.status_code}"
    print("Test 9 Passed: Completing already completed session rejected with 400.")

    # 10. Start Session 2 and Cancel Workout Session
    r10_start = client.post("/workout-sessions/start", json={"session_id": sess2_id})
    assert r10_start.status_code == 200
    ws2_id = r10_start.json()["id"]

    r10_cancel = client.post(f"/workout-sessions/{ws2_id}/cancel", json={"session_notes": "Rain stop"})
    assert r10_cancel.status_code == 200
    assert r10_cancel.json()["status"] == "cancelled"
    print("Test 10 Passed: Cancelled workout session successfully.")

    # 11. Authorization: Athlete 2 forbidden from pausing Athlete 1's completed/active session
    app.dependency_overrides[get_current_user] = lambda: athlete_2
    r11 = client.post(f"/workout-sessions/{ws1_id}/pause")
    assert r11.status_code == 403
    print("Test 11 Passed: Athlete 2 forbidden from modifying Athlete 1's workout session.")

    # 12. Coach read-only access to assigned athlete's session
    app.dependency_overrides[get_current_user] = lambda: coach_1
    r12_get = client.get(f"/workout-sessions/{ws1_id}")
    assert r12_get.status_code == 200
    assert r12_get.json()["id"] == ws1_id

    r12_write = client.post(f"/workout-sessions/{ws1_id}/pause")
    assert r12_write.status_code == 403
    print("Test 12 Passed: Coach has read-only access to assigned athlete workout session.")

    # 13. Admin full access
    app.dependency_overrides[get_current_user] = lambda: admin_1
    r13 = client.get(f"/workout-sessions/{ws1_id}")
    assert r13.status_code == 200
    print("Test 13 Passed: Admin has full access.")

    app.dependency_overrides.clear()
    print("All Workout Session System Unit Tests Passed Successfully!")


def test_workout_session_suite():
    run_tests()


if __name__ == "__main__":
    run_tests()
