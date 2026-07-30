import asyncio
from fastapi.testclient import TestClient
from main import app
from bson.objectid import ObjectId


class FakeResult:
    def __init__(self, matched=1, modified=1):
        self.matched_count = matched
        self.modified_count = modified


class FakeCollection:
    def __init__(self, initial=None):
        self.data = initial or {}

    async def find_one(self, query):
        for v in self.data.values():
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
        for k, v in self.data.items():
            match = True
            for qk, qv in query.items():
                if v.get(qk) != qv:
                    match = False
                    break
            if match:
                set_ops = update.get("$set", {})
                v.update(set_ops)
                return FakeResult(matched=1, modified=1)
        return FakeResult(matched=0, modified=0)

    async def insert_one(self, document):
        if "_id" not in document:
            document["_id"] = str(ObjectId())
        self.data[document.get("workout_id") or document["_id"]] = document
        return document

    async def find(self, query=None):
        query = query or {}
        for v in self.data.values():
            match = True
            for k, val in query.items():
                if v.get(k) != val:
                    match = False
                    break
            if match:
                yield v


def setup_fakes():
    from database import mongodb
    from routes import workout_routes

    # Setup initial mock data
    users = {
        "coach_u": {
            "_id": ObjectId("6a4369de519959ce63a0022a"),
            "name": "Coach User",
            "email": "coach@example.com",
            "role": "coach",
            "coach_id": "coach-1"
        },
        "athlete_u": {
            "_id": ObjectId("6a4369df519959ce63a0022b"),
            "name": "Athlete User",
            "email": "athlete@example.com",
            "role": "athlete"
        },
        "other_athlete_u": {
            "_id": ObjectId("6a4369df519959ce63a0022c"),
            "name": "Other Athlete User",
            "email": "other@example.com",
            "role": "athlete"
        }
    }
    
    athletes = {
        "athlete_ath": {
            "athlete_id": "6a4369df519959ce63a0022b",
            "owner_id": "6a4369df519959ce63a0022b",
            "name": "Athlete User",
            "coach_id": "coach-1"
        },
        "other_athlete_ath": {
            "athlete_id": "6a4369df519959ce63a0022c",
            "owner_id": "6a4369df519959ce63a0022c",
            "name": "Other Athlete User",
            "coach_id": "coach-2"
        }
    }

    workouts = {}

    fake_users = FakeCollection(users)
    fake_athletes = FakeCollection(athletes)
    fake_workouts = FakeCollection(workouts)

    mongodb.users_collection = fake_users
    mongodb.athletes_collection = fake_athletes
    mongodb.workouts_collection = fake_workouts

    workout_routes.users_collection = fake_users
    workout_routes.athletes_collection = fake_athletes
    workout_routes.workouts_collection = fake_workouts

    from services import workout_service
    from repositories import workout_repository, athlete_repository
    workout_service.workouts_collection = fake_workouts
    workout_repository.workout_repository.collection = fake_workouts
    athlete_repository.athlete_repository.collection = fake_athletes





def run_tests():
    setup_fakes()
    client = TestClient(app)
    from services.auth_service import get_current_user

    print("Running Workout Management Unit Tests...")

    # 1. Non-coach try to create workout plan -> 403 Forbidden
    app.dependency_overrides[get_current_user] = lambda: {
        "id": "6a4369df519959ce63a0022b", 
        "role": "athlete", 
        "email": "athlete@example.com"
    }
    r = client.post("/workouts/", json={
        "title": "Ath Stretches",
        "athlete_id": "6a4369df519959ce63a0022b",
        "date": "2026-07-03",
        "exercises": [{"name": "Stretch", "sets": 3, "reps": 12}]
    })
    assert r.status_code == 403, f"Expected 403, got {r.status_code} and detail: {r.json()}"
    print("Test 1 Passed: Athlete forbidden from creating workout.")

    # 2. Coach tries to create workout plan for assigned athlete -> 200 OK
    app.dependency_overrides[get_current_user] = lambda: {
        "id": "6a4369de519959ce63a0022a", 
        "role": "coach", 
        "email": "coach@example.com"
    }
    r = client.post("/workouts/", json={
        "title": "Leg Day",
        "description": "Lower body strength",
        "athlete_id": "6a4369df519959ce63a0022b",
        "date": "2026-07-04",
        "exercises": [{"name": "Squats", "sets": 4, "reps": 8, "duration": "1 min"}]
    })
    assert r.status_code == 200, f"Expected 200, got {r.status_code} and detail: {r.json()}"
    workout_id = r.json().get("workout_id")
    assert workout_id is not None, "Workout ID not returned"
    print("Test 2 Passed: Coach successfully created workout for assigned athlete.")

    # 3. Coach tries to create workout plan for unassigned athlete -> 403 Forbidden
    r = client.post("/workouts/", json={
        "title": "Unassigned Run",
        "athlete_id": "6a4369df519959ce63a0022c",
        "date": "2026-07-04",
        "exercises": [{"name": "Sprint", "sets": 5, "reps": 1}]
    })
    assert r.status_code == 403, f"Expected 403, got {r.status_code} and detail: {r.json()}"
    print("Test 3 Passed: Coach forbidden from creating workout for unassigned athlete.")

    # 4. Coach fetch workouts -> 200 OK
    r = client.get("/workouts/coach/coach-1")
    assert r.status_code == 200, f"Expected 200, got {r.status_code} and detail: {r.json()}"
    workouts_list = r.json()
    assert len(workouts_list) == 1, f"Expected 1 workout, got {len(workouts_list)}"
    assert workouts_list[0]["title"] == "Leg Day", "Workout title mismatch"
    print("Test 4 Passed: Coach successfully retrieved their created workouts.")

    # 5. Coach try to fetch other coach workouts -> 403 Forbidden
    r = client.get("/workouts/coach/coach-2")
    assert r.status_code == 403, f"Expected 403, got {r.status_code}"
    print("Test 5 Passed: Coach forbidden from viewing other coach workouts.")

    # 6. Athlete fetch their own workouts -> 200 OK
    app.dependency_overrides[get_current_user] = lambda: {
        "id": "6a4369df519959ce63a0022b", 
        "role": "athlete", 
        "email": "athlete@example.com"
    }
    r = client.get("/workouts/athlete/6a4369df519959ce63a0022b")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    assert len(r.json()) == 1, f"Expected 1 workout, got {len(r.json())}"
    print("Test 6 Passed: Athlete successfully retrieved their workouts.")

    # 7. Athlete try to view another athlete's workouts -> 403 Forbidden
    r = client.get("/workouts/athlete/6a4369df519959ce63a0022c")
    assert r.status_code == 403, f"Expected 403, got {r.status_code}"
    print("Test 7 Passed: Athlete forbidden from retrieving other athlete's workouts.")

    # 8. Athlete update status of their own workout -> 200 OK
    r = client.put(f"/workouts/{workout_id}/status", json={"status": "completed"})
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    assert r.json().get("status") == "completed", "Status update failed"
    print("Test 8 Passed: Athlete successfully updated status of their workout.")

    # 9. Athlete try to update status of non-existent workout -> 404 Not Found
    r = client.put("/workouts/nonexistent/status", json={"status": "skipped"})
    assert r.status_code == 404, f"Expected 404, got {r.status_code}"
    print("Test 9 Passed: Updating non-existent workout status returned 404.")

    print("All Workout Management tests passed successfully!")


def test_workout_legacy_suite():
    run_tests()


if __name__ == '__main__':
    run_tests()

