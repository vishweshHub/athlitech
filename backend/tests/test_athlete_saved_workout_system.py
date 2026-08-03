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
                if v.get(k) != val:
                    match = False
                    break
            if match:
                matched.append(v)
        return FakeCursor(matched)

    async def delete_one(self, query):
        target = await self.find_one(query)
        if target:
            target_id = target.get("id") or str(target.get("_id"))
            if target_id in self.data:
                del self.data[target_id]
                return FakeResult(deleted=1)
        return FakeResult(deleted=0)


def test_athlete_saved_workout_suite():
    # Setup test users
    athlete_user = {"id": "ath_123", "role": "athlete", "email": "athlete@test.com", "name": "Test Athlete"}
    coach_user = {"id": "coach_123", "role": "coach", "email": "coach@test.com", "name": "Test Coach"}
    admin_user = {"id": "admin_123", "role": "admin", "email": "admin@test.com", "name": "Test Admin"}

    # Setup fake database collections
    fake_workouts = FakeCollection({
        "tmpl_1": {
            "id": "tmpl_1",
            "title": "Sprint Power Template",
            "sport": "Track",
            "category": "Sprint",
            "difficulty": "Advanced",
            "exercises": [{"name": "Block Starts", "sets": 5, "reps": 3}],
            "created_at": get_utc_now(),
        },
        "tmpl_2": {
            "id": "tmpl_2",
            "title": "Flying 30s Template",
            "sport": "Track",
            "category": "Speed",
            "difficulty": "Intermediate",
            "exercises": [{"name": "Flying 30m", "sets": 4, "reps": 1}],
            "created_at": get_utc_now(),
        },
    })
    fake_saved_workouts = FakeCollection()

    # Import repositories
    from repositories.workout_repository import workout_repository
    from repositories.athlete_saved_workout_repository import athlete_saved_workout_repository

    workout_repository.collection = fake_workouts
    athlete_saved_workout_repository.collection = fake_saved_workouts

    current_user_holder = [athlete_user]

    def mock_get_current_user():
        return current_user_holder[0]

    app.dependency_overrides[get_current_user] = mock_get_current_user

    client = TestClient(app)

    try:
        # 1. Save Workout Template -> Success (201 Created)
        resp = client.post("/athletes/me/saved-workouts", json={"workout_template_id": "tmpl_1"})
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["athlete_id"] == "ath_123"
        assert data["workout_template_id"] == "tmpl_1"
        assert data["workout_template"]["title"] == "Sprint Power Template"

        # 2. Duplicate Prevention -> 400 Bad Request
        resp_dup = client.post("/athletes/me/saved-workouts", json={"workout_template_id": "tmpl_1"})
        assert resp_dup.status_code == 400
        assert "already saved" in resp_dup.json()["detail"]

        # 3. Invalid Workout Template -> 404 Not Found
        resp_inv = client.post("/athletes/me/saved-workouts", json={"workout_template_id": "non_existent_tmpl"})
        assert resp_inv.status_code == 404
        assert "Workout template not found" in resp_inv.json()["detail"]

        # 4. Save second workout template
        resp2 = client.post("/athletes/me/saved-workouts", json={"workout_template_id": "tmpl_2"})
        assert resp2.status_code == 201

        # 5. List Saved Workouts -> Sorted newest first with populated template details
        resp_list = client.get("/athletes/me/saved-workouts")
        assert resp_list.status_code == 200
        items = resp_list.json()
        assert len(items) == 2
        assert items[0]["workout_template"]["title"] in ["Sprint Power Template", "Flying 30s Template"]

        # 6. Authorization: Coach Denied -> 403 Forbidden
        current_user_holder[0] = coach_user
        resp_coach_save = client.post("/athletes/me/saved-workouts", json={"workout_template_id": "tmpl_1"})
        assert resp_coach_save.status_code == 403

        resp_coach_get = client.get("/athletes/me/saved-workouts")
        assert resp_coach_get.status_code == 403

        # 7. Authorization: Admin Read Access
        current_user_holder[0] = admin_user
        resp_admin_get = client.get("/athletes/me/saved-workouts?athlete_id=ath_123")
        assert resp_admin_get.status_code == 200
        assert len(resp_admin_get.json()) == 2

        # Switch back to Athlete
        current_user_holder[0] = athlete_user

        # 8. Remove Saved Workout -> Success
        resp_del = client.delete("/athletes/me/saved-workouts/tmpl_1")
        assert resp_del.status_code == 200
        assert resp_del.json()["workout_template_id"] == "tmpl_1"

        # 9. Remove non-existent or already deleted item -> 404 Not Found
        resp_del_404 = client.delete("/athletes/me/saved-workouts/tmpl_1")
        assert resp_del_404.status_code == 404

        # 10. List remaining items
        resp_list_rem = client.get("/athletes/me/saved-workouts")
        assert resp_list_rem.status_code == 200
        rem_items = resp_list_rem.json()
        assert len(rem_items) == 1
        assert rem_items[0]["workout_template_id"] == "tmpl_2"

        # 11. Empty Collection Verification
        client.delete("/athletes/me/saved-workouts/tmpl_2")
        resp_empty = client.get("/athletes/me/saved-workouts")
        assert resp_empty.status_code == 200
        assert len(resp_empty.json()) == 0

    finally:
        app.dependency_overrides.clear()
