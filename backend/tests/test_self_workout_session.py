import pytest
from datetime import datetime
from core.utils import get_utc_now
from fastapi.testclient import TestClient
from bson.objectid import ObjectId

from main import app
from services.auth_service import get_current_user


class FakeResult:
    def __init__(self, matched=1, modified=1, deleted=1):
        self.matched_count = matched
        self.modified_count = modified
        self.deleted_count = deleted


class FakeCursor:
    def __init__(self, items):
        self.items = items

    def sort(self, key, direction=-1):
        reverse = direction == -1
        self.items = sorted(self.items, key=lambda x: x.get(key, datetime.min), reverse=reverse)
        return self

    async def to_list(self, length=1000):
        return self.items[:length]

    def __aiter__(self):
        self._iter = iter(self.items)
        return self

    async def __anext__(self):
        try:
            return next(self._iter)
        except StopIteration:
            raise StopAsyncIteration


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
                elif isinstance(val, dict) and "$in" in val:
                    if v.get(k) not in val["$in"]:
                        match = False
                        break
                elif v.get(k) != val:
                    match = False
                    break
            if match:
                return v
        return None

    async def insert_one(self, doc):
        doc_id = doc.get("id") or str(doc.get("_id", "def_id"))
        self.data[doc_id] = doc
        return doc

    def find(self, query=None):
        query = query or {}
        matched = []
        for v in list(self.data.values()):
            match = True
            for k, val in query.items():
                if isinstance(val, dict) and "$in" in val:
                    if v.get(k) not in val["$in"]:
                        match = False
                        break
                elif v.get(k) != val:
                    match = False
                    break
            if match:
                matched.append(v)
        return FakeCursor(matched)

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
            target_id = target.get("id") or str(target.get("_id"))
            if target_id in self.data:
                del self.data[target_id]
                return FakeResult(deleted=1)
        return FakeResult(deleted=0)


def test_self_workout_session_suite():
    # Setup test users
    athlete_user = {"id": "ath_99", "role": "athlete", "email": "athlete99@test.com", "name": "Athlete 99"}
    coach_user = {"id": "coach_99", "role": "coach", "email": "coach99@test.com", "name": "Coach 99"}

    # Fake database collections
    fake_sessions = FakeCollection({
        "sess_planned_1": {
            "id": "sess_planned_1",
            "training_day_id": "day_1",
            "session_name": "AM Speed Session",
        }
    })
    fake_training_plans = FakeCollection()
    fake_workouts = FakeCollection({
        "tmpl_saved_1": {
            "id": "tmpl_saved_1",
            "title": "Saved Sprint Drills",
            "sport": "Track",
            "category": "Sprint",
            "difficulty": "Advanced",
        },
        "tmpl_unsaved_1": {
            "id": "tmpl_unsaved_1",
            "title": "Unsaved Heavy Squat",
            "sport": "Gym",
            "category": "Strength",
            "difficulty": "Advanced",
        },
    })
    fake_saved_workouts = FakeCollection({
        "saved_rec_1": {
            "id": "saved_rec_1",
            "athlete_id": "ath_99",
            "workout_template_id": "tmpl_saved_1",
            "created_at": get_utc_now(),
        }
    })
    fake_workout_sessions = FakeCollection()

    # Import repositories and wire collections
    from repositories.session_repository import session_repository
    from repositories.workout_repository import workout_repository
    from repositories.athlete_saved_workout_repository import athlete_saved_workout_repository
    from repositories.workout_session_repository import workout_session_repository

    session_repository.sessions_collection = fake_sessions
    workout_repository.collection = fake_workouts
    athlete_saved_workout_repository.collection = fake_saved_workouts
    workout_session_repository.collection = fake_workout_sessions

    current_user_holder = [athlete_user]

    def mock_get_current_user():
        return current_user_holder[0]

    app.dependency_overrides[get_current_user] = mock_get_current_user

    client = TestClient(app)

    try:
        # 1. Invalid Request: Both IDs supplied -> 400 Bad Request
        resp_both = client.post("/workout-sessions/start", json={
            "session_id": "sess_planned_1",
            "workout_template_id": "tmpl_saved_1",
        })
        assert resp_both.status_code == 400

        # 2. Invalid Request: Neither ID supplied -> 400 Bad Request
        resp_neither = client.post("/workout-sessions/start", json={})
        assert resp_neither.status_code == 400

        # 3. Invalid Request: Non-existent workout template -> 404 Not Found
        resp_404 = client.post("/workout-sessions/start", json={
            "workout_template_id": "non_existent_tmpl",
        })
        assert resp_404.status_code == 404

        # 4. Invalid Request: Unsaved workout template -> 400 Bad Request
        resp_unsaved = client.post("/workout-sessions/start", json={
            "workout_template_id": "tmpl_unsaved_1",
        })
        assert resp_unsaved.status_code == 400
        assert "has not saved" in resp_unsaved.json()["detail"]

        # 5. Invalid Request: Coach cannot start session -> 403 Forbidden
        current_user_holder[0] = coach_user
        resp_coach = client.post("/workout-sessions/start", json={
            "workout_template_id": "tmpl_saved_1",
        })
        assert resp_coach.status_code == 403

        # Switch back to Athlete
        current_user_holder[0] = athlete_user

        # 6. Valid Self Workout Flow -> 200/201 Success
        resp_self = client.post("/workout-sessions/start", json={
            "workout_template_id": "tmpl_saved_1",
            "session_notes": "Self-directed afternoon sprint work",
        })
        assert resp_self.status_code == 200, resp_self.text
        data_self = resp_self.json()
        assert data_self["source_type"] == "SELF"
        assert data_self["workout_template_id"] == "tmpl_saved_1"
        assert data_self["session_id"] is None
        assert data_self["status"] == "in_progress"
        ws_self_id = data_self["id"]

        # 7. Check active workout session
        resp_active = client.get("/workout-sessions/active")
        assert resp_active.status_code == 200
        assert resp_active.json()["id"] == ws_self_id
        assert resp_active.json()["source_type"] == "SELF"

        # 8. Complete self workout session
        resp_complete = client.post(f"/workout-sessions/{ws_self_id}/complete", json={
            "completion_percentage": 100.0,
            "session_notes": "Completed all reps cleanly",
        })
        assert resp_complete.status_code == 200
        assert resp_complete.json()["status"] == "completed"

        # 9. Valid Planned Session Flow -> 200 Success
        resp_planned = client.post("/workout-sessions/start", json={
            "session_id": "sess_planned_1",
        })
        assert resp_planned.status_code == 200, resp_planned.text
        data_planned = resp_planned.json()
        assert data_planned["source_type"] == "PLANNED"
        assert data_planned["session_id"] == "sess_planned_1"
        assert data_planned["workout_template_id"] is None
        assert data_planned["status"] == "in_progress"

    finally:
        app.dependency_overrides.clear()
