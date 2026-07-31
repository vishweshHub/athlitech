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
    )
    from repositories import (
        training_plan_repository,
        session_repository,
        workout_assignment_repository,
        workout_repository,
        athlete_repository,
    )

    plans_fake = FakeCollection()
    weeks_fake = FakeCollection()
    days_fake = FakeCollection()
    sessions_fake = FakeCollection()
    assignments_fake = FakeCollection()
    workouts_fake = FakeCollection()
    athletes_fake = FakeCollection()

    mongodb.training_plans_collection = plans_fake
    mongodb.training_weeks_collection = weeks_fake
    mongodb.training_days_collection = days_fake
    mongodb.sessions_collection = sessions_fake
    mongodb.workout_assignments_collection = assignments_fake
    mongodb.workouts_collection = workouts_fake
    mongodb.athletes_collection = athletes_fake

    training_plan_routes.training_plans_collection = plans_fake
    training_plan_routes.training_weeks_collection = weeks_fake
    training_plan_routes.training_days_collection = days_fake

    session_routes.sessions_collection = sessions_fake
    workout_assignment_routes.workout_assignments_collection = assignments_fake
    workout_routes.workouts_collection = workouts_fake

    training_plan_repository.training_plan_repository.plans_collection = plans_fake
    training_plan_repository.training_plan_repository.weeks_collection = weeks_fake
    training_plan_repository.training_plan_repository.days_collection = days_fake

    session_repository.session_repository.sessions_collection = sessions_fake
    workout_assignment_repository.workout_assignment_repository.collection = assignments_fake
    workout_repository.workout_repository.collection = workouts_fake
    athlete_repository.athlete_repository.collection = athletes_fake

    return workouts_fake, athletes_fake


# Test Users
athlete_1 = {"id": "ath-111", "name": "Athlete One", "email": "athlete1@athlitech.com", "role": "athlete"}
athlete_2 = {"id": "ath-222", "name": "Athlete Two", "email": "athlete2@athlitech.com", "role": "athlete"}
coach_1 = {"id": "coach-111", "name": "Coach One", "email": "coach1@athlitech.com", "role": "coach"}
admin_1 = {"id": "admin-111", "name": "Admin One", "email": "admin1@athlitech.com", "role": "admin"}


def run_tests():
    workouts_fake, athletes_fake = setup_fakes()
    client = TestClient(app)

    print("Running Today's Training System Unit Test Suite...")

    # Seed coach assignment for athlete 1
    athletes_fake.data["ath-111"] = {
        "id": "ath-111",
        "athlete_id": "ath-111",
        "name": "Athlete One",
        "coach_id": "coach-111"
    }

    # Seed Workout Template
    wt_id = "wt-555"
    workouts_fake.data[wt_id] = {
        "id": wt_id,
        "title": "Explosive Block Starts",
        "sport": "Track & Field",
        "category": "Sprint",
        "difficulty": "Advanced",
        "duration_minutes": 45,
        "equipment": ["Starting Blocks", "Spikes"],
        "instructions": "Execute 5x30m block starts at 100% intensity."
    }

    today_str = datetime.now().strftime("%Y-%m-%d")

    # 1. Empty state when no active training plan exists
    app.dependency_overrides[get_current_user] = lambda: athlete_1
    r1 = client.get("/training/today")
    assert r1.status_code == 200
    res1 = r1.json()
    assert res1["has_training"] is False
    assert res1["status"] == "NO_PLAN"
    print("Test 1 Passed: Empty state when no active plan exists.")

    # 2. Create Active Training Plan
    r_plan = client.post("/training-plans/", json={
        "title": "Olympic Velocity Plan",
        "goal": "100m Gold",
        "athlete_id": "ath-111",
        "start_date": "2026-08-01",
        "end_date": "2026-10-31",
        "status": "active"
    })
    assert r_plan.status_code == 200
    plan_id = r_plan.json()["id"]

    r_week = client.post("/training-plans/weeks/", json={
        "training_plan_id": plan_id,
        "week_number": 1,
        "phase_tag": "Base",
        "title": "Week 1: Base Building"
    })
    assert r_week.status_code == 200
    week_id = r_week.json()["id"]

    # 3. Create Rest Day for today
    r_day_rest = client.post("/training-plans/days/", json={
        "training_week_id": week_id,
        "date": today_str,
        "day_name": "Monday Rest",
        "day_type": "Rest",
        "notes": "Full active recovery rest day"
    })
    assert r_day_rest.status_code == 200
    rest_day_id = r_day_rest.json()["id"]

    # Check Rest Day response
    r3 = client.get("/training/today")
    assert r3.status_code == 200
    res3 = r3.json()
    assert res3["has_training"] is False
    assert res3["status"] == "REST_DAY"
    assert res3["training_day"]["day_type"] == "Rest"
    print("Test 2 Passed: Rest Day correctly returns has_training=False and status=REST_DAY.")

    # 4. Update Day to Training Day
    r_day_update = client.put(f"/training-plans/days/{rest_day_id}", json={
        "day_type": "Training",
        "notes": "Switched to active speed training day"
    })
    assert r_day_update.status_code == 200

    # 5. Create Sessions
    r_sess1 = client.post("/training-plans/sessions/", json={
        "training_day_id": rest_day_id,
        "session_name": "Morning Acceleration Track",
        "order": 1,
        "start_time": "08:00",
        "end_time": "09:30"
    })
    sess1_id = r_sess1.json()["id"]

    r_sess2 = client.post("/training-plans/sessions/", json={
        "training_day_id": rest_day_id,
        "session_name": "Afternoon Hypertrophy Gym",
        "order": 2,
        "start_time": "16:00",
        "end_time": "17:30"
    })
    sess2_id = r_sess2.json()["id"]

    # 6. Create Workout Assignments
    r_assign1 = client.post("/training-plans/assignments/", json={
        "session_id": sess1_id,
        "workout_template_id": wt_id,
        "category": "main",
        "order": 1,
        "assignment_note": "Focus on driving off the block",
        "overrides": {"reps": 5, "rest": "4 min"}
    })
    assert r_assign1.status_code == 200

    # 7. Complete today training retrieval
    r7 = client.get("/training/today")
    assert r7.status_code == 200
    res7 = r7.json()
    assert res7["has_training"] is True
    assert res7["status"] == "NOT_STARTED"
    assert res7["training_plan"]["title"] == "Olympic Velocity Plan"
    assert res7["training_week"]["title"] == "Week 1: Base Building"
    assert res7["training_day"]["day_type"] == "Training"
    assert len(res7["sessions"]) == 2

    # Verify session 1 and embedded assignment with template details
    sess1_res = res7["sessions"][0]
    assert sess1_res["session_name"] == "Morning Acceleration Track"
    assert len(sess1_res["assignments"]) == 1
    assign1_res = sess1_res["assignments"][0]
    assert assign1_res["workout_template"]["title"] == "Explosive Block Starts"
    assert assign1_res["overrides"]["reps"] == 5
    print("Test 3 Passed: Complete Today's Training aggregation with ordered sessions, assignments, and template details.")

    # 8. Authorization: Athlete 2 forbidden from viewing Athlete 1's training schedule
    app.dependency_overrides[get_current_user] = lambda: athlete_2
    r8 = client.get(f"/training/today?athlete_id=ath-111")
    assert r8.status_code == 403
    print("Test 4 Passed: Athlete 2 forbidden from requesting Athlete 1's schedule.")

    # 9. Authorization: Coach assigned to Athlete 1 can view schedule
    app.dependency_overrides[get_current_user] = lambda: coach_1
    r9 = client.get(f"/training/today?athlete_id=ath-111")
    assert r9.status_code == 200
    assert r9.json()["has_training"] is True
    print("Test 5 Passed: Coach can view assigned athlete's today training.")

    # 10. Authorization: Admin can view any athlete's schedule
    app.dependency_overrides[get_current_user] = lambda: admin_1
    r10 = client.get(f"/training/today?athlete_id=ath-111")
    assert r10.status_code == 200
    assert r10.json()["has_training"] is True
    print("Test 6 Passed: Admin can view any athlete's today training.")

    # 11. Direct db["workouts"] Coach Assignment Filtering & Lifecycle
    app.dependency_overrides[get_current_user] = lambda: athlete_2
    workouts_fake.data["w-assigned-99"] = {
        "workout_id": "w-assigned-99",
        "athlete_id": "ath-222",
        "coach_id": "coach-111",
        "title": "Explosive Block Starts",
        "description": "Perform 5x30m starts",
        "status": "pending",
        "date": today_str,
    }
    r11_a = client.get("/training/today")
    assert r11_a.status_code == 200
    assert r11_a.json()["has_training"] is True
    assert r11_a.json()["sessions"][0]["assignments"][0]["id"] == "w-assigned-99"

    # Completed workout should be hidden
    workouts_fake.data["w-assigned-99"]["status"] = "completed"
    r11_b = client.get("/training/today")
    assert r11_b.status_code == 200
    assert r11_b.json()["has_training"] is False

    # Skipped workout should remain visible
    workouts_fake.data["w-assigned-99"]["status"] = "skipped"
    r11_c = client.get("/training/today")
    assert r11_c.status_code == 200
    assert r11_c.json()["has_training"] is True

    # Cancelled workout should be hidden
    workouts_fake.data["w-assigned-99"]["status"] = "cancelled"
    r11_d = client.get("/training/today")
    assert r11_d.status_code == 200
    assert r11_d.json()["has_training"] is False

    print("Test 7 Passed: Direct db['workouts'] lifecycle (pending/active/skipped visible, completed/cancelled hidden).")

    app.dependency_overrides.clear()
    print("All Today's Training System Unit Tests Passed Successfully!")


def test_today_training_suite():
    run_tests()


if __name__ == "__main__":
    run_tests()
