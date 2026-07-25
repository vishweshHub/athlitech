"""
test_integration.py
-------------------
Integration test for the Coach Workout Assignment workflow.

Tests the full end-to-end flow:
  1. Admin assigns athlete to coach.
  2. Coach retrieves their athletes (validating preselection state context).
  3. Coach creates workout plan for the athlete.
  4. Athlete retrieves their workout plans.
"""

import json
import urllib.request
import urllib.error
from database.mongodb import users_collection, athletes_collection, workouts_collection
from core.security import hash_password
from bson.objectid import ObjectId
import asyncio

# Test data identifiers
TEST_COACH_EMAIL = "integration-coach@example.com"
TEST_ATHLETE_EMAIL = "integration-athlete@example.com"
TEST_ADMIN_EMAIL = "integration-admin@example.com"

BASE_URL = "http://127.0.0.1:8000"

async def setup_integration_data():
    # Clean any old test data
    await clean_integration_data()

    # Create Admin user
    admin_id = str(ObjectId())
    await users_collection.insert_one({
        "_id": ObjectId(admin_id),
        "name": "Integration Admin",
        "email": TEST_ADMIN_EMAIL,
        "role": "admin",
        "hashed_password": hash_password("Admin@2024!")
    })

    # Create Coach user
    coach_id = str(ObjectId())
    await users_collection.insert_one({
        "_id": ObjectId(coach_id),
        "name": "Integration Coach",
        "email": TEST_COACH_EMAIL,
        "role": "coach",
        "coach_id": "integration-coach-id",
        "hashed_password": hash_password("Coach#99ab")
    })

    # Create Athlete user
    athlete_id = str(ObjectId())
    await users_collection.insert_one({
        "_id": ObjectId(athlete_id),
        "name": "Integration Athlete",
        "email": TEST_ATHLETE_EMAIL,
        "role": "athlete",
        "hashed_password": hash_password("Athlete1$x")
    })

    return admin_id, coach_id, athlete_id

async def clean_integration_data():
    await users_collection.delete_many({"email": {"$in": [TEST_COACH_EMAIL, TEST_ATHLETE_EMAIL, TEST_ADMIN_EMAIL]}})
    await athletes_collection.delete_many({"name": "Integration Athlete"})
    await athletes_collection.delete_many({"athlete_id": {"$in": [TEST_ATHLETE_EMAIL, TEST_COACH_EMAIL]}})
    await workouts_collection.delete_many({"title": "Integration Speed Day"})

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

async def run_integration_tests():
    print("=" * 60)
    print("Running Coach Workout Assignment Integration Tests...")
    print("=" * 60)

    # 1. Setup DB records
    admin_id, coach_id, athlete_id = await setup_integration_data()
    
    target_athlete_id = athlete_id
    target_coach_id = "integration-coach-id"

    try:
        # Step 0: Log in as admin, coach, and athlete to get real JWT tokens
        print("Logging in to obtain JWT tokens...")
        admin_token = make_request(f"{BASE_URL}/auth/login", "POST", {"email": TEST_ADMIN_EMAIL, "password": "Admin@2024!"})[0]["access_token"]
        coach_token = make_request(f"{BASE_URL}/auth/login", "POST", {"email": TEST_COACH_EMAIL, "password": "Coach#99ab"})[0]["access_token"]
        athlete_token = make_request(f"{BASE_URL}/auth/login", "POST", {"email": TEST_ATHLETE_EMAIL, "password": "Athlete1$x"})[0]["access_token"]

        # Step 1: Admin assigns athlete to coach
        assign_url = f"{BASE_URL}/athletes/{target_athlete_id}/assign/{target_coach_id}"
        print(f"Step 1: Admin assigning athlete {target_athlete_id} to coach {target_coach_id}...")
        resp, status = make_request(assign_url, "POST", token=admin_token)
        assert status == 200, f"Failed assignment: {status} - {resp}"
        print("  -> SUCCESS: Athlete assigned to coach successfully.")

        # Step 2: Coach retrieves their athletes (validate they have exactly 1 athlete assigned)
        athletes_url = f"{BASE_URL}/coaches/{target_coach_id}/athletes"
        print("Step 2: Coach fetching assigned athletes...")
        resp_athletes, status = make_request(athletes_url, "GET", token=coach_token)
        assert status == 200, f"Failed fetch athletes: {status}"
        assert len(resp_athletes) == 1, f"Expected 1 athlete, got {len(resp_athletes)}"
        assert resp_athletes[0]["athlete_id"] == target_athlete_id, "Athlete ID mismatch"
        print(f"  -> SUCCESS: Coach has exactly 1 athlete assigned ({resp_athletes[0]['name']}).")

        # Step 3: Coach creates workout plan for the athlete
        print("Step 3: Coach creating workout plan...")
        workout_payload = {
            "title": "Integration Speed Day",
            "description": "Explosive block starts and sprint endurance",
            "athlete_id": target_athlete_id,
            "date": "2026-07-10",
            "exercises": [
                {"name": "Block Starts", "sets": 5, "reps": 1, "duration": "10s"},
                {"name": "60m Sprints", "sets": 3, "reps": 1, "duration": "6s"}
            ]
        }
        resp_workout, status = make_request(f"{BASE_URL}/workouts/", "POST", workout_payload, token=coach_token)
        assert status == 200, f"Failed to create workout: {status} - {resp_workout}"
        workout_id = resp_workout.get("workout_id")
        assert workout_id is not None, "Workout ID not returned in response"
        print(f"  -> SUCCESS: Workout created successfully (ID: {workout_id}).")

        # Step 4: Athlete receives the workout
        athlete_workouts_url = f"{BASE_URL}/workouts/athlete/{target_athlete_id}"
        print("Step 4: Athlete fetching their workouts...")
        resp_workouts, status = make_request(athlete_workouts_url, "GET", token=athlete_token)
        assert status == 200, f"Failed to fetch athlete workouts: {status}"
        matched_workout = [w for w in resp_workouts if w["workout_id"] == workout_id]
        assert len(matched_workout) == 1, "Created workout not found in athlete workouts list"
        assert matched_workout[0]["title"] == "Integration Speed Day"
        print("  -> SUCCESS: Athlete successfully received the assigned workout plan.")

        print("=" * 60)
        print("All integration flow checks PASSED successfully!")
        print("=" * 60)

    finally:
        # Clean up database records
        await clean_integration_data()

if __name__ == "__main__":
    asyncio.run(run_integration_tests())
