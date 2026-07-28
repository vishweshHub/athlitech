import pytest
from datetime import datetime, timedelta
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
                elif k == "started_at" and isinstance(val, dict) and "$lt" in val:
                    curr = v.get(k)
                    if not isinstance(curr, datetime) or curr >= val["$lt"]:
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
            for k, val in query.items():
                if isinstance(val, dict) and "$in" in val:
                    if v.get(k) not in val["$in"]:
                        match = False
                        break
                elif k == "started_at" and isinstance(val, dict) and "$lt" in val:
                    curr = v.get(k)
                    if not isinstance(curr, datetime) or curr >= val["$lt"]:
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
        workout_session_routes,
        metric_definition_routes,
        performance_log_routes,
        activity_feed_routes,
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

    return ws_fake, performance_logs_fake, metric_defs_fake, workouts_fake, athletes_fake


# Test Users
athlete_1 = {"id": "ath-111", "name": "Athlete One", "email": "athlete1@athlitech.com", "role": "athlete"}
athlete_2 = {"id": "ath-222", "name": "Athlete Two", "email": "athlete2@athlitech.com", "role": "athlete"}
coach_1 = {"id": "coach-111", "name": "Coach One", "email": "coach1@athlitech.com", "role": "coach"}
admin_1 = {"id": "admin-111", "name": "Admin One", "email": "admin1@athlitech.com", "role": "admin"}


def run_tests():
    ws_fake, performance_logs_fake, metric_defs_fake, workouts_fake, athletes_fake = setup_fakes()
    client = TestClient(app)

    print("Running Activity Feed System Unit Test Suite...")

    # Seed coach assignment
    athletes_fake.data["ath-111"] = {
        "id": "ath-111",
        "athlete_id": "ath-111",
        "name": "Athlete One",
        "coach_id": "coach-111"
    }

    # 1. Empty Activity Feed test
    app.dependency_overrides[get_current_user] = lambda: athlete_1
    r1 = client.get("/activity-feed")
    assert r1.status_code == 200
    assert r1.json()["days"] == []
    assert r1.json()["next_cursor"] is None
    print("Test 1 Passed: Empty activity feed returned successfully.")

    # Seed Metric Definition
    metric_defs_fake.data["m-1"] = {
        "id": "m-1",
        "metric_key": "time",
        "display_name": "Sprint Time",
        "unit": "s",
        "better_direction": "lower"
    }

    # Seed Workout Template
    wt_id = "wt-100"
    workouts_fake.data[wt_id] = {
        "id": wt_id,
        "title": "Block Starts Template",
        "sport": "Track & Field"
    }

    # Populate Workout Sessions for Athlete 1 across 2 dates
    # Date 1: 2026-08-05 10:00:00
    dt_aug5 = datetime(2026, 8, 5, 10, 0, 0)
    ws1_id = "ws-aug5"
    ws_fake.data[ws1_id] = {
        "id": ws1_id,
        "session_id": "sess-planned-1",
        "athlete_id": "ath-111",
        "status": "completed",
        "started_at": dt_aug5,
        "total_duration_seconds": 2700,  # 45 minutes
        "completion_percentage": 100.0,
    }

    # Performance Log for ws1 (has PR and Coach Logged source)
    performance_logs_fake.data["log-1"] = {
        "id": "log-1",
        "workout_session_id": ws1_id,
        "assignment_id": "assign-1",
        "athlete_id": "ath-111",
        "activity_label": "Flying 30m Sprint",
        "metrics": {"time": 3.82},
        "source_type": "coach",
        "is_personal_record": True,
        "recorded_at": dt_aug5
    }

    # Date 2: 2026-08-02 09:00:00 (Gap of 2 days: Aug 4 and Aug 3)
    dt_aug2 = datetime(2026, 8, 2, 9, 0, 0)
    ws2_id = "ws-aug2"
    ws_fake.data[ws2_id] = {
        "id": ws2_id,
        "session_id": "sess-planned-2",
        "athlete_id": "ath-111",
        "status": "completed",
        "started_at": dt_aug2,
        "total_duration_seconds": 1800,  # 30 minutes
        "completion_percentage": 100.0,
    }

    # 2. Retrieve Activity Feed
    r2 = client.get("/activity-feed")
    assert r2.status_code == 200
    feed_data = r2.json()
    days = feed_data["days"]
    assert len(days) == 2, f"Expected 2 day groups, got {len(days)}"

    # Day 1: 2026-08-05
    assert days[0]["date"] == "2026-08-05"
    assert days[0]["gap_days_before"] == 0
    assert len(days[0]["sessions"]) == 1
    card1 = days[0]["sessions"][0]
    assert card1["workout_session_id"] == ws1_id
    assert card1["duration_minutes"] == 45
    assert "Coach Logged" in card1["badges"]
    assert "Personal Record" in card1["badges"]
    assert len(card1["headline_metrics"]) == 1
    assert card1["headline_metrics"][0]["label"] == "Sprint Time"
    assert card1["headline_metrics"][0]["value"] == 3.82
    assert card1["headline_metrics"][0]["unit"] == "s"

    # Day 2: 2026-08-02 (gap_days_before should be 2: Aug 4 & Aug 3)
    assert days[1]["date"] == "2026-08-02"
    assert days[1]["gap_days_before"] == 2
    assert len(days[1]["sessions"]) == 1
    print("Test 2 Passed: Retrieved activity feed with correct day grouping, gap calculation, headline metrics, and badges.")

    # 3. Cursor Pagination (limit=1)
    r3 = client.get("/activity-feed?limit=1")
    assert r3.status_code == 200
    p1 = r3.json()
    assert len(p1["days"]) == 1
    assert p1["days"][0]["date"] == "2026-08-05"
    assert p1["next_cursor"] is not None

    # Fetch page 2 using cursor
    cursor_val = p1["next_cursor"]
    r4 = client.get(f"/activity-feed?cursor={cursor_val}&limit=1")
    assert r4.status_code == 200
    p2 = r4.json()
    assert len(p2["days"]) == 1
    assert p2["days"][0]["date"] == "2026-08-02"
    print("Test 3 Passed: Cursor-based pagination functions as expected.")

    # 4. Authorization tests
    app.dependency_overrides[get_current_user] = lambda: athlete_2
    r_ath2 = client.get("/activity-feed?athlete_id=ath-111")
    assert r_ath2.status_code == 403
    print("Test 4 Passed: Athlete 2 forbidden from viewing Athlete 1's activity feed.")

    app.dependency_overrides[get_current_user] = lambda: coach_1
    r_coach = client.get("/activity-feed?athlete_id=ath-111")
    assert r_coach.status_code == 200
    assert len(r_coach.json()["days"]) == 2
    print("Test 5 Passed: Coach can view assigned athlete's activity feed.")

    app.dependency_overrides[get_current_user] = lambda: admin_1
    r_admin = client.get("/activity-feed?athlete_id=ath-111")
    assert r_admin.status_code == 200
    assert len(r_admin.json()["days"]) == 2
    print("Test 6 Passed: Admin can view any athlete's activity feed.")

    app.dependency_overrides.clear()
    print("All Activity Feed System Unit Tests Passed Successfully!")


def test_activity_feed_suite():
    run_tests()


if __name__ == "__main__":
    run_tests()
