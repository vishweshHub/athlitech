from fastapi.testclient import TestClient
from main import app
from bson.objectid import ObjectId
from datetime import datetime


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
            key = target.get("id") or target.get("workout_id") or str(target.get("_id"))
            if key in self.data:
                del self.data[key]
                return FakeResult(deleted=1)
        return FakeResult(deleted=0)

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
                        if isinstance(val, dict) and "$regex" in val:
                            pattern = val["$regex"].lower()
                            if pattern not in str(v.get(k, "")).lower():
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
                    if isinstance(val, dict):
                        if "$exists" in val:
                            req_exists = val["$exists"]
                            has_key = k in v and v[k] is not None
                            if req_exists != has_key:
                                match = False
                                break
                        elif "$ne" in val:
                            if v.get(k) == val["$ne"]:
                                match = False
                                break
                        elif "$regex" in val:
                            pattern = val["$regex"].replace("^", "").replace("$", "").lower()
                            if pattern not in str(v.get(k, "")).lower():
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
    from routes import workout_routes
    from services import workout_service
    from repositories.workout_repository import workout_repository

    workouts = {}
    fake_workouts = FakeCollection(workouts)

    mongodb.workouts_collection = fake_workouts
    workout_routes.workouts_collection = fake_workouts
    workout_service.workouts_collection = fake_workouts
    workout_repository.collection = fake_workouts


def run_tests():
    setup_fakes()
    client = TestClient(app)
    from services.auth_service import get_current_user

    print("Running Workout Library Unit Tests...")

    admin_user = {"id": "user-admin-1", "name": "Admin User", "email": "admin@example.com", "role": "admin"}
    coach_1 = {"id": "user-coach-1", "name": "Coach One", "email": "coach1@example.com", "role": "coach"}
    coach_2 = {"id": "user-coach-2", "name": "Coach Two", "email": "coach2@example.com", "role": "coach"}
    athlete_user = {"id": "user-athlete-1", "name": "Athlete One", "email": "athlete1@example.com", "role": "athlete"}

    # 1. Athlete forbidden from creating workout template
    app.dependency_overrides[get_current_user] = lambda: athlete_user
    r = client.post("/workouts/", json={
        "title": "Athlete Workout",
        "sport": "Running",
        "category": "Cardio",
        "difficulty": "Beginner",
        "duration_minutes": 30
    })
    assert r.status_code == 403, f"Expected 403, got {r.status_code}: {r.json()}"
    print("Test 1 Passed: Athlete forbidden from creating workout template.")

    # 2. Validation error: duration_minutes <= 0
    app.dependency_overrides[get_current_user] = lambda: coach_1
    r = client.post("/workouts/", json={
        "title": "Invalid Duration",
        "sport": "Running",
        "category": "Cardio",
        "difficulty": "Beginner",
        "duration_minutes": 0
    })
    assert r.status_code == 422, f"Expected 422, got {r.status_code}"
    print("Test 2 Passed: duration_minutes <= 0 correctly rejected with 422.")

    # 3. Validation error: invalid difficulty enum
    r = client.post("/workouts/", json={
        "title": "Invalid Difficulty",
        "sport": "Running",
        "category": "Cardio",
        "difficulty": "SuperHard",
        "duration_minutes": 30
    })
    assert r.status_code == 422, f"Expected 422, got {r.status_code}"
    print("Test 3 Passed: Invalid difficulty enum correctly rejected with 422.")

    # 4. Validation error: empty title string
    r = client.post("/workouts/", json={
        "title": "   ",
        "sport": "Running",
        "category": "Cardio",
        "difficulty": "Beginner",
        "duration_minutes": 30
    })
    assert r.status_code == 422, f"Expected 422, got {r.status_code}"
    print("Test 4 Passed: Empty whitespace string correctly rejected with 422.")

    # 5. Coach 1 creates workout template
    app.dependency_overrides[get_current_user] = lambda: coach_1
    r = client.post("/workouts/", json={
        "title": "Coach 1 Endurance Run",
        "description": "5km steady state run",
        "sport": "Track & Field",
        "category": "Endurance",
        "difficulty": "Intermediate",
        "duration_minutes": 45,
        "equipment": ["Running Shoes", "Heart Rate Monitor"],
        "instructions": "Maintain zone 2 heart rate."
    })
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.json()}"
    coach_1_workout = r.json()
    w1_id = coach_1_workout["id"]
    assert coach_1_workout["created_by"] == "user-coach-1"
    assert coach_1_workout["equipment"] == ["Running Shoes", "Heart Rate Monitor"]
    print("Test 5 Passed: Coach 1 successfully created workout template.")

    # 6. Admin creates workout template
    app.dependency_overrides[get_current_user] = lambda: admin_user
    r = client.post("/workouts/", json={
        "title": "Admin Strength Program",
        "sport": "Weightlifting",
        "category": "Strength",
        "difficulty": "Advanced",
        "duration_minutes": 60
    })
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.json()}"
    admin_workout = r.json()
    admin_w_id = admin_workout["id"]
    assert admin_workout["created_by"] == "user-admin-1"
    print("Test 6 Passed: Admin successfully created workout template.")

    # 7. Athlete retrieves personalized workout templates (Read-only access)
    app.dependency_overrides[get_current_user] = lambda: athlete_user
    r = client.get("/workouts/")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    templates = r.json()
    assert len(templates) >= 1, f"Expected at least 1 template, got {len(templates)}"
    print("Test 7 Passed: Athlete successfully read personalized workout templates.")

    # 8. Get workout by ID
    r = client.get(f"/workouts/{w1_id}")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    assert r.json()["title"] == "Coach 1 Endurance Run"

    r = client.get("/workouts/non-existent-id")
    assert r.status_code == 404, f"Expected 404, got {r.status_code}"
    print("Test 8 Passed: GET workout by ID returns correct workout or 404.")

    # 9. Coach 2 tries to update Coach 1's workout -> 403 Forbidden
    app.dependency_overrides[get_current_user] = lambda: coach_2
    r = client.put(f"/workouts/{w1_id}", json={"title": "Hacked Title"})
    assert r.status_code == 403, f"Expected 403, got {r.status_code}: {r.json()}"
    print("Test 9 Passed: Coach 2 forbidden from updating Coach 1's workout template.")

    # 10. Coach 1 updates own workout template -> 200 OK
    app.dependency_overrides[get_current_user] = lambda: coach_1
    r = client.put(f"/workouts/{w1_id}", json={
        "title": "Coach 1 Updated Endurance Run",
        "duration_minutes": 50
    })
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    assert r.json()["title"] == "Coach 1 Updated Endurance Run"
    assert r.json()["duration_minutes"] == 50
    print("Test 10 Passed: Coach 1 successfully updated own workout template.")

    # 11. Admin updates any workout template -> 200 OK
    app.dependency_overrides[get_current_user] = lambda: admin_user
    r = client.put(f"/workouts/{w1_id}", json={"category": "High Endurance"})
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    assert r.json()["category"] == "High Endurance"
    print("Test 11 Passed: Admin successfully updated Coach 1's workout template.")

    # 12. Coach 2 tries to delete Coach 1's workout -> 403 Forbidden
    app.dependency_overrides[get_current_user] = lambda: coach_2
    r = client.delete(f"/workouts/{w1_id}")
    assert r.status_code == 403, f"Expected 403, got {r.status_code}"
    print("Test 12 Passed: Coach 2 forbidden from deleting Coach 1's workout template.")

    # 13. Athlete tries to delete workout template -> 403 Forbidden
    app.dependency_overrides[get_current_user] = lambda: athlete_user
    r = client.delete(f"/workouts/{w1_id}")
    assert r.status_code == 403, f"Expected 403, got {r.status_code}"
    print("Test 13 Passed: Athlete forbidden from deleting workout template.")

    # 14. Coach 1 deletes own workout template -> 200 OK
    app.dependency_overrides[get_current_user] = lambda: coach_1
    r = client.delete(f"/workouts/{w1_id}")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    print("Test 14 Passed: Coach 1 successfully deleted own workout template.")

    # 15. Admin deletes workout template -> 200 OK
    app.dependency_overrides[get_current_user] = lambda: admin_user
    r = client.delete(f"/workouts/{admin_w_id}")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    print("Test 15 Passed: Admin successfully deleted workout template.")

    print("All Workout Library Unit Tests Passed Successfully!")


def test_workout_library_suite():
    run_tests()


if __name__ == "__main__":
    run_tests()

