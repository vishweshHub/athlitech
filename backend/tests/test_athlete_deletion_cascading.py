"""
test_athlete_deletion_cascading.py
-----------------------------------
Integration tests to verify cascading athlete deletion:
1. Creating athlete user, profile, workouts, and performances.
2. Deleting athlete user.
3. Verifying profile, workouts, and performances are all deleted (no orphan references).
"""

import json
import urllib.request
import urllib.error
import asyncio
from bson.objectid import ObjectId
from database.mongodb import users_collection, athletes_collection, workouts_collection, performance_collection
from core.security import hash_password

# Test credentials
TEST_ADMIN_EMAIL = "cascade-admin@example.com"
TEST_COACH_EMAIL = "cascade-coach@example.com"
TEST_ATHLETE_EMAIL = "cascade-athlete@example.com"
BASE_URL = "http://127.0.0.1:8000"

async def setup_test_data():
    await clean_test_data()

    # Create admin
    admin_id = str(ObjectId())
    await users_collection.insert_one({
        "_id": ObjectId(admin_id),
        "name": "Cascade Admin",
        "email": TEST_ADMIN_EMAIL,
        "role": "admin",
        "hashed_password": hash_password("Admin@2024!")
    })

    # Create Coach
    coach_id = str(ObjectId())
    await users_collection.insert_one({
        "_id": ObjectId(coach_id),
        "name": "Cascade Coach",
        "email": TEST_COACH_EMAIL,
        "role": "coach",
        "coach_id": "cascade-coach-id",
        "hashed_password": hash_password("Coach#99ab")
    })

    # Create Athlete
    athlete_id = str(ObjectId())
    await users_collection.insert_one({
        "_id": ObjectId(athlete_id),
        "name": "Cascade Athlete",
        "email": TEST_ATHLETE_EMAIL,
        "role": "athlete",
        "hashed_password": hash_password("Athlete1$x")
    })

    # Create Athlete Profile
    await athletes_collection.insert_one({
        "athlete_id": athlete_id,
        "name": "Cascade Athlete",
        "coach_id": "cascade-coach-id",
        "sport": "Sprinting",
        "weight": "75"
    })

    # Create Athlete Workouts
    await workouts_collection.insert_one({
        "workout_id": "cascade-workout-1",
        "title": "Cascade Workout 1",
        "athlete_id": athlete_id,
        "coach_id": "cascade-coach-id",
        "status": "pending",
        "exercises": []
    })

    # Create Athlete Performances
    await performance_collection.insert_one({
        "performance_id": "cascade-perf-1",
        "athlete_id": athlete_id,
        "coach_id": "cascade-coach-id",
        "sport_event": "100m Sprint",
        "value": 11.2,
        "unit": "seconds"
    })

    return admin_id, athlete_id

async def clean_test_data():
    await users_collection.delete_many({"email": {"$in": [TEST_ADMIN_EMAIL, TEST_COACH_EMAIL, TEST_ATHLETE_EMAIL]}})
    await athletes_collection.delete_many({"athlete_id": {"$exists": True}, "name": "Cascade Athlete"})
    await workouts_collection.delete_many({"athlete_id": {"$exists": True}, "title": "Cascade Workout 1"})
    await performance_collection.delete_many({"athlete_id": {"$exists": True}, "sport_event": "100m Sprint"})

def make_request(url, method="GET", payload=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    data = None
    if payload:
        data = json.dumps(payload).encode()
        
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read()), resp.status
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"HTTP Error {e.code}: {body}")
        raise

async def run_tests():
    print("=" * 70)
    print("Running Athlete Deletion Cascading Integration Tests...")
    print("=" * 70)

    admin_id, athlete_id = await setup_test_data()

    try:
        # Obtain JWT token for Admin
        print("Obtaining JWT token for test admin...")
        admin_token = make_request(
            f"{BASE_URL}/auth/login", 
            "POST", 
            {"email": TEST_ADMIN_EMAIL, "password": "Admin@2024!"}
        )[0]["access_token"]

        # Confirm data pre-exists
        prof_pre = await athletes_collection.find_one({"athlete_id": athlete_id})
        work_pre = await workouts_collection.find_one({"athlete_id": athlete_id})
        perf_pre = await performance_collection.find_one({"athlete_id": athlete_id})
        assert prof_pre is not None
        assert work_pre is not None
        assert perf_pre is not None
        print("  -> Confirmed Athlete profile, workouts, and performances exist before deletion.")

        # Delete the Athlete user
        print("Deleting athlete user...")
        resp_del, status_del = make_request(
            f"{BASE_URL}/users/{athlete_id}",
            "DELETE",
            token=admin_token
        )
        assert status_del == 200
        print("  -> Athlete user deleted successfully.")

        # Verify athlete profile has been deleted
        profile = await athletes_collection.find_one({"athlete_id": athlete_id})
        assert profile is None, "Expected athlete profile to be deleted"
        print("  -> SUCCESS: Athlete profile successfully removed from database.")

        # Verify athlete workouts have been deleted
        workout = await workouts_collection.find_one({"athlete_id": athlete_id})
        assert workout is None, "Expected athlete workouts to be deleted"
        print("  -> SUCCESS: Athlete workouts successfully deleted.")

        # Verify athlete performances have been deleted
        performance = await performance_collection.find_one({"athlete_id": athlete_id})
        assert performance is None, "Expected athlete performance records to be deleted"
        print("  -> SUCCESS: Athlete performance records successfully deleted (No orphan references).")

        print("=" * 70)
        print("All Athlete Deletion Cascading integration tests PASSED!")
        print("=" * 70)

    finally:
        await clean_test_data()

if __name__ == "__main__":
    asyncio.run(run_tests())
