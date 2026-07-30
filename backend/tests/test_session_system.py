import pytest
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
        key = document.get("id") or str(document["_id"])
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
    from routes import training_plan_routes, session_routes, workout_assignment_routes
    from repositories import training_plan_repository, session_repository, workout_assignment_repository

    plans_fake = FakeCollection()
    weeks_fake = FakeCollection()
    days_fake = FakeCollection()
    sessions_fake = FakeCollection()
    assignments_fake = FakeCollection()

    mongodb.training_plans_collection = plans_fake
    mongodb.training_weeks_collection = weeks_fake
    mongodb.training_days_collection = days_fake
    mongodb.sessions_collection = sessions_fake
    mongodb.workout_assignments_collection = assignments_fake

    training_plan_routes.training_plans_collection = plans_fake
    training_plan_routes.training_weeks_collection = weeks_fake
    training_plan_routes.training_days_collection = days_fake

    session_routes.sessions_collection = sessions_fake
    workout_assignment_routes.workout_assignments_collection = assignments_fake

    training_plan_repository.training_plan_repository.plans_collection = plans_fake
    training_plan_repository.training_plan_repository.weeks_collection = weeks_fake
    training_plan_repository.training_plan_repository.days_collection = days_fake

    session_repository.session_repository.sessions_collection = sessions_fake
    workout_assignment_repository.workout_assignment_repository.collection = assignments_fake



# Test Users
athlete_1 = {"id": "ath-111", "name": "Athlete One", "email": "athlete1@athlitech.com", "role": "athlete"}
athlete_2 = {"id": "ath-222", "name": "Athlete Two", "email": "athlete2@athlitech.com", "role": "athlete"}
coach_1 = {"id": "coach-111", "name": "Coach One", "email": "coach1@athlitech.com", "role": "coach"}
admin_1 = {"id": "admin-111", "name": "Admin One", "email": "admin1@athlitech.com", "role": "admin"}


def run_tests():
    setup_fakes()
    client = TestClient(app)

    print("Running Session Entity System Unit Test Suite...")

    # 1. Validation error: empty session_name
    app.dependency_overrides[get_current_user] = lambda: athlete_1
    r1 = client.post("/training-plans/sessions/", json={
        "training_day_id": "day-123",
        "session_name": "   ",
        "order": 1
    })
    assert r1.status_code == 422, f"Expected 422, got {r1.status_code}"
    print("Test 1 Passed: Empty session_name rejected with 422.")

    # 2. Validation error: invalid order (< 1)
    r2 = client.post("/training-plans/sessions/", json={
        "training_day_id": "day-123",
        "session_name": "Morning Track",
        "order": 0
    })
    assert r2.status_code == 422, f"Expected 422, got {r2.status_code}"
    print("Test 2 Passed: Invalid order (< 1) rejected with 422.")

    # 3. Reject session creation for non-existent Training Day ID
    r3 = client.post("/training-plans/sessions/", json={
        "training_day_id": "non-existent-day",
        "session_name": "Morning Track",
        "order": 1
    })
    assert r3.status_code == 404, f"Expected 404, got {r3.status_code}"
    print("Test 3 Passed: Session creation for non-existent day rejected with 404.")

    # Create parent hierarchy: Plan -> Week -> Day
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

    # 4. Create valid Session 1
    r4 = client.post("/training-plans/sessions/", json={
        "training_day_id": day_id,
        "session_name": "Morning Velocity Track Session",
        "order": 1,
        "start_time": "08:00",
        "end_time": "09:30"
    })
    assert r4.status_code == 200, f"Expected 200, got {r4.status_code}: {r4.json()}"
    s1_data = r4.json()
    s1_id = s1_data["id"]
    assert s1_data["session_name"] == "Morning Velocity Track Session"
    assert s1_data["order"] == 1
    print("Test 4 Passed: Athlete created valid Session 1.")

    # 5. Duplicate order validation error
    r5 = client.post("/training-plans/sessions/", json={
        "training_day_id": day_id,
        "session_name": "Duplicate Order Session",
        "order": 1
    })
    assert r5.status_code == 400, f"Expected 400, got {r5.status_code}"
    print("Test 5 Passed: Duplicate order value within same Training Day rejected with 400.")

    # 6. Create valid Session 2
    r6 = client.post("/training-plans/sessions/", json={
        "training_day_id": day_id,
        "session_name": "Evening Hypertrophy Gym Session",
        "order": 2,
        "start_time": "17:00",
        "end_time": "18:30"
    })
    assert r6.status_code == 200, f"Expected 200, got {r6.status_code}: {r6.json()}"
    s2_data = r6.json()
    s2_id = s2_data["id"]
    assert s2_data["order"] == 2
    print("Test 6 Passed: Athlete created valid Session 2.")

    # 7. Get Sessions by Training Day (verify ordering by order asc)
    r7 = client.get(f"/training-plans/days/{day_id}/sessions")
    assert r7.status_code == 200
    sessions_list = r7.json()
    assert len(sessions_list) == 2
    assert sessions_list[0]["id"] == s1_id
    assert sessions_list[1]["id"] == s2_id
    print("Test 7 Passed: Sessions retrieved by Training Day in correct order.")

    # 8. Get Session by ID
    r8 = client.get(f"/training-plans/sessions/{s1_id}")
    assert r8.status_code == 200
    assert r8.json()["session_name"] == "Morning Velocity Track Session"
    print("Test 8 Passed: Retrieved Session by ID.")

    # 9. Update Session
    r9 = client.put(f"/training-plans/sessions/{s1_id}", json={
        "session_name": "Updated Morning Track Session",
        "start_time": "08:15"
    })
    assert r9.status_code == 200
    assert r9.json()["session_name"] == "Updated Morning Track Session"
    assert r9.json()["start_time"] == "08:15"
    print("Test 9 Passed: Updated Session successfully.")

    # 10. Athlete 2 forbidden from accessing Athlete 1's Session
    app.dependency_overrides[get_current_user] = lambda: athlete_2
    r10 = client.get(f"/training-plans/sessions/{s1_id}")
    assert r10.status_code == 403, f"Expected 403, got {r10.status_code}"

    r10_put = client.put(f"/training-plans/sessions/{s1_id}", json={"session_name": "Hacked Name"})
    assert r10_put.status_code == 403
    print("Test 10 Passed: Athlete 2 forbidden from accessing/modifying Athlete 1's session.")

    # 11. Admin has full access
    app.dependency_overrides[get_current_user] = lambda: admin_1
    r11 = client.get(f"/training-plans/sessions/{s1_id}")
    assert r11.status_code == 200
    print("Test 11 Passed: Admin has full access to Session.")

    # 12. Delete Session directly
    app.dependency_overrides[get_current_user] = lambda: athlete_1
    r12 = client.delete(f"/training-plans/sessions/{s2_id}")
    assert r12.status_code == 200
    assert client.get(f"/training-plans/sessions/{s2_id}").status_code == 404
    print("Test 12 Passed: Session 2 deleted successfully.")

    # 13. Cascade deletion: Deleting Day deletes child Session 1
    r13 = client.delete(f"/training-plans/days/{day_id}")
    assert r13.status_code == 200
    assert client.get(f"/training-plans/sessions/{s1_id}").status_code == 404
    print("Test 13 Passed: Cascade deletion verified (Deleting Day removed child Session).")

    app.dependency_overrides.clear()
    print("All Session Entity Unit Tests Passed Successfully!")


def test_session_suite():
    run_tests()


if __name__ == "__main__":
    run_tests()
