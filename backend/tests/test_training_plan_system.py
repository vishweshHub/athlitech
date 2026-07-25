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
    from routes import training_plan_routes
    from repositories import training_plan_repository

    plans_fake = FakeCollection()
    weeks_fake = FakeCollection()
    days_fake = FakeCollection()

    mongodb.training_plans_collection = plans_fake
    mongodb.training_weeks_collection = weeks_fake
    mongodb.training_days_collection = days_fake

    training_plan_routes.training_plans_collection = plans_fake
    training_plan_routes.training_weeks_collection = weeks_fake
    training_plan_routes.training_days_collection = days_fake

    training_plan_repository.training_plan_repository.plans_collection = plans_fake
    training_plan_repository.training_plan_repository.weeks_collection = weeks_fake
    training_plan_repository.training_plan_repository.days_collection = days_fake


# Test Users
athlete_1 = {"id": "ath-111", "name": "Athlete One", "email": "athlete1@athlitech.com", "role": "athlete"}
athlete_2 = {"id": "ath-222", "name": "Athlete Two", "email": "athlete2@athlitech.com", "role": "athlete"}
coach_1 = {"id": "coach-111", "name": "Coach One", "email": "coach1@athlitech.com", "role": "coach"}
admin_1 = {"id": "admin-111", "name": "Admin One", "email": "admin1@athlitech.com", "role": "admin"}


def run_tests():
    setup_fakes()
    client = TestClient(app)

    print("Running Training Plan System Unit Test Suite...")

    # 1. Validation error: empty title
    app.dependency_overrides[get_current_user] = lambda: athlete_1
    r1 = client.post("/training-plans/", json={
        "title": "   ",
        "description": "Invalid title",
        "goal": "Build Speed",
        "athlete_id": "ath-111",
        "start_date": "2026-08-01",
        "end_date": "2026-10-31"
    })
    assert r1.status_code == 422, f"Expected 422, got {r1.status_code}"
    print("Test 1 Passed: Empty title string rejected with 422.")

    # 2. Validation error: invalid status enum
    r2 = client.post("/training-plans/", json={
        "title": "Invalid Status Plan",
        "goal": "Build Speed",
        "athlete_id": "ath-111",
        "start_date": "2026-08-01",
        "end_date": "2026-10-31",
        "status": "super_active"
    })
    assert r2.status_code == 422, f"Expected 422, got {r2.status_code}"
    print("Test 2 Passed: Invalid status enum rejected with 422.")

    # 3. Athlete cannot create training plan for another athlete
    r3 = client.post("/training-plans/", json={
        "title": "Forbidden Plan",
        "goal": "Build Speed",
        "athlete_id": "ath-222",
        "start_date": "2026-08-01",
        "end_date": "2026-10-31"
    })
    assert r3.status_code == 403, f"Expected 403, got {r3.status_code}"
    print("Test 3 Passed: Athlete forbidden from creating plan for another athlete.")

    # 4. Athlete creates valid training plan
    r4 = client.post("/training-plans/", json={
        "title": "Off-Season Velocity Program",
        "description": "12-Week Speed & Acceleration Plan",
        "goal": "Sub-10.5 100m Sprint",
        "athlete_id": "ath-111",
        "start_date": "2026-08-01",
        "end_date": "2026-10-31",
        "status": "active"
    })
    assert r4.status_code == 200, f"Expected 200, got {r4.status_code}: {r4.json()}"
    plan_data = r4.json()
    plan_id = plan_data["id"]
    assert plan_data["owner_type"] == "self"
    assert plan_data["created_by"] == "ath-111"
    print("Test 4 Passed: Athlete successfully created Training Plan.")

    # 5. Cannot create week for non-existent plan
    r5 = client.post("/training-plans/weeks/", json={
        "training_plan_id": "non-existent-plan-id",
        "week_number": 1,
        "phase_tag": "Base",
        "title": "Week 1: Base Building"
    })
    assert r5.status_code == 404, f"Expected 404, got {r5.status_code}"
    print("Test 5 Passed: Week creation for non-existent plan rejected with 404.")

    # 6. Validation error: invalid phase_tag enum
    r6 = client.post("/training-plans/weeks/", json={
        "training_plan_id": plan_id,
        "week_number": 1,
        "phase_tag": "UltraHardPhase",
        "title": "Week 1: Base Building"
    })
    assert r6.status_code == 422, f"Expected 422, got {r6.status_code}"
    print("Test 6 Passed: Invalid phase_tag enum rejected with 422.")

    # 7. Create valid Training Week
    r7 = client.post("/training-plans/weeks/", json={
        "training_plan_id": plan_id,
        "week_number": 1,
        "phase_tag": "Base",
        "title": "Week 1: General Acceleration Base",
        "target_volume": "1200m total sprint volume",
        "target_intensity": "75-85% Max Velocity"
    })
    assert r7.status_code == 200, f"Expected 200, got {r7.status_code}: {r7.json()}"
    week_data = r7.json()
    week_id = week_data["id"]
    assert week_data["training_plan_id"] == plan_id
    assert week_data["phase_tag"] == "Base"
    print("Test 7 Passed: Training Week successfully created.")

    # 8. Cannot create day for non-existent week
    r8 = client.post("/training-plans/days/", json={
        "training_week_id": "non-existent-week-id",
        "date": "2026-08-01",
        "day_name": "Monday",
        "day_type": "Training"
    })
    assert r8.status_code == 404, f"Expected 404, got {r8.status_code}"
    print("Test 8 Passed: Day creation for non-existent week rejected with 404.")

    # 9. Validation error: invalid day_type enum
    r9 = client.post("/training-plans/days/", json={
        "training_week_id": week_id,
        "date": "2026-08-01",
        "day_name": "Monday",
        "day_type": "SuperWorkout"
    })
    assert r9.status_code == 422, f"Expected 422, got {r9.status_code}"
    print("Test 9 Passed: Invalid day_type enum rejected with 422.")

    # 10. Create valid Training Day
    r10 = client.post("/training-plans/days/", json={
        "training_week_id": week_id,
        "date": "2026-08-01",
        "day_name": "Monday",
        "day_type": "Training",
        "notes": "Focus on 10m block acceleration mechanics and dynamic warm-up."
    })
    assert r10.status_code == 200, f"Expected 200, got {r10.status_code}: {r10.json()}"
    day_data = r10.json()
    day_id = day_data["id"]
    assert day_data["training_week_id"] == week_id
    assert day_data["day_type"] == "Training"
    print("Test 10 Passed: Training Day successfully created.")

    # 11. Retrieve plan by ID & nested weeks/days
    r11_weeks = client.get(f"/training-plans/plans/{plan_id}/weeks")
    assert r11_weeks.status_code == 200
    assert len(r11_weeks.json()) == 1

    r11_days = client.get(f"/training-plans/weeks/{week_id}/days")
    assert r11_days.status_code == 200
    assert len(r11_days.json()) == 1
    print("Test 11 Passed: Nested weeks and days retrieved successfully.")

    # 12. Athlete 2 forbidden from accessing Athlete 1's plan
    app.dependency_overrides[get_current_user] = lambda: athlete_2
    r12 = client.get(f"/training-plans/{plan_id}")
    assert r12.status_code == 403, f"Expected 403, got {r12.status_code}"
    print("Test 12 Passed: Athlete 2 forbidden from accessing Athlete 1's plan.")

    # 13. Cascade deletion: Delete plan and verify week and day deleted
    app.dependency_overrides[get_current_user] = lambda: athlete_1
    r13 = client.delete(f"/training-plans/{plan_id}")
    assert r13.status_code == 200, f"Expected 200, got {r13.status_code}"

    # Verify plan, week, and day deleted
    assert client.get(f"/training-plans/{plan_id}").status_code == 404
    assert client.get(f"/training-plans/weeks/{week_id}").status_code == 404
    assert client.get(f"/training-plans/days/{day_id}").status_code == 404
    print("Test 13 Passed: Cascade deletion verified (Plan, Week, and Day removed).")

    app.dependency_overrides.clear()
    print("All Training Plan System Unit Tests Passed Successfully!")


def test_training_plan_suite():
    run_tests()


if __name__ == "__main__":
    run_tests()
