"""
test_completion_performance.py
------------------------------
Integration test for the improved Workout Completion and Performance record linking.

Tests the full end-to-end flow:
  1. Admin assigns athlete to coach.
  2. Coach assigns a workout to the athlete.
  3. Athlete updates status to "completed" with percentage (95%) and notes.
  4. Coach reviews the completed workout.
  5. Coach attempts to log performance for a pending workout -> returns 400.
  6. Coach logs performance linked to the completed workout -> success.
  7. Athlete retrieves performance history and verifies linked fields.
"""

import json
import urllib.request
import urllib.error
import asyncio
from bson.objectid import ObjectId
from database.mongodb import users_collection, athletes_collection, workouts_collection, performance_collection
from core.security import hash_password

# Test IDs & credentials
TEST_COACH_EMAIL = "workflow-coach@example.com"
TEST_ATHLETE_EMAIL = "workflow-athlete@example.com"
TEST_ADMIN_EMAIL = "workflow-admin@example.com"

BASE_URL = "http://127.0.0.1:8000"

async def setup_test_data():
    await clean_test_data()

    # Create Admin user
    admin_id = str(ObjectId())
    await users_collection.insert_one({
        "_id": ObjectId(admin_id),
        "name": "Workflow Admin",
        "email": TEST_ADMIN_EMAIL,
        "role": "admin",
        "hashed_password": hash_password("Admin@2024!")
    })

    # Create Coach user
    coach_id = str(ObjectId())
    await users_collection.insert_one({
        "_id": ObjectId(coach_id),
        "name": "Workflow Coach",
        "email": TEST_COACH_EMAIL,
        "role": "coach",
        "coach_id": "workflow-coach-id",
        "hashed_password": hash_password("Coach#99ab")
    })

    # Create Athlete user
    athlete_id = str(ObjectId())
    await users_collection.insert_one({
        "_id": ObjectId(athlete_id),
        "name": "Workflow Athlete",
        "email": TEST_ATHLETE_EMAIL,
        "role": "athlete",
        "hashed_password": hash_password("Athlete1$x")
    })

    return admin_id, coach_id, athlete_id

async def clean_test_data():
    await users_collection.delete_many({"email": {"$in": [TEST_COACH_EMAIL, TEST_ATHLETE_EMAIL, TEST_ADMIN_EMAIL]}})
    await athletes_collection.delete_many({"athlete_id": {"$in": [TEST_ATHLETE_EMAIL, TEST_COACH_EMAIL]}})
    await athletes_collection.delete_many({"name": "Workflow Athlete"})
    await workouts_collection.delete_many({"title": "Workflow Sprint Session"})
    await performance_collection.delete_many({"athlete_id": TEST_ATHLETE_EMAIL})

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
    print("Running Workout Completion & Linked Performance Workflow Tests...")
    print("=" * 70)

    # 1. Setup DB records
    admin_id, coach_id, athlete_id = await setup_test_data()
    target_athlete_id = athlete_id
    target_coach_id = "workflow-coach-id"

    try:
        # Step 0: Get Real JWT Tokens
        print("Obtaining JWT tokens for Admin, Coach, and Athlete...")
        admin_token = make_request(f"{BASE_URL}/auth/login", "POST", {"email": TEST_ADMIN_EMAIL, "password": "Admin@2024!"})[0]["access_token"]
        coach_token = make_request(f"{BASE_URL}/auth/login", "POST", {"email": TEST_COACH_EMAIL, "password": "Coach#99ab"})[0]["access_token"]
        athlete_token = make_request(f"{BASE_URL}/auth/login", "POST", {"email": TEST_ATHLETE_EMAIL, "password": "Athlete1$x"})[0]["access_token"]

        # Step 1: Admin assigns athlete to coach
        assign_url = f"{BASE_URL}/athletes/{target_athlete_id}/assign/{target_coach_id}"
        print(f"Step 1: Assigning athlete {target_athlete_id} to coach {target_coach_id}...")
        resp, status = make_request(assign_url, "POST", token=admin_token)
        assert status == 200, f"Assignment failed: {status}"
        print("  -> SUCCESS: Athlete assigned.")

        # Step 2: Coach creates a workout plan
        print("Step 2: Coach creating workout plan...")
        workout_payload = {
            "title": "Workflow Sprint Session",
            "description": "Explosive acceleration drills",
            "athlete_id": target_athlete_id,
            "date": "2026-07-10",
            "exercises": [
                {"name": "30m Block Starts", "sets": 6, "reps": 1, "duration": "5s"}
            ]
        }
        resp_workout, status = make_request(f"{BASE_URL}/workouts/", "POST", workout_payload, token=coach_token)
        assert status == 200, f"Workout creation failed: {status}"
        workout_id = resp_workout.get("workout_id")
        assert workout_id is not None
        print(f"  -> SUCCESS: Workout created (ID: {workout_id}).")

        # Step 3: Coach attempts to log a performance linked to this workout BEFORE completion -> should FAIL
        print("Step 3: Coach trying to log performance for pending workout...")
        perf_payload_pending = {
            "athlete_id": target_athlete_id,
            "workout_id": workout_id,
            "sport_event": "100m Sprint",
            "value": 10.22,
            "unit": "seconds",
            "feedback": "Outstanding acceleration",
            "recorded_at": "2026-07-10",
            "date": "2026-07-10" # fallback
        }
        try:
            make_request(f"{BASE_URL}/performances/", "POST", perf_payload_pending, token=coach_token)
            assert False, "Expected 400 Bad Request but endpoint succeeded"
        except urllib.error.HTTPError as e:
            assert e.code == 400, f"Expected 400, got {e.code}"
            print("  -> SUCCESS: Correctly rejected performance record for pending workout.")

        # Step 4: Athlete records workout completion with percentage and notes
        print("Step 4: Athlete recording completion details...")
        completion_payload = {
            "status": "completed",
            "completed_at": "2026-07-10 13:14:00",
            "completion_percentage": 95,
            "athlete_notes": "Felt very explosive, slight hamstring tightness at the end."
        }
        resp_complete, status = make_request(f"{BASE_URL}/workouts/{workout_id}/status", "PUT", completion_payload, token=athlete_token)
        assert status == 200, f"Failed updating status: {status}"
        assert resp_complete["status"] == "completed"
        assert resp_complete["completion_percentage"] == 95
        assert resp_complete["athlete_notes"] == "Felt very explosive, slight hamstring tightness at the end."
        print("  -> SUCCESS: Completion recorded successfully.")

        # Step 5: Coach reviews the completed workout and successfully logs the performance record
        print("Step 5: Coach logging performance linked to completed workout...")
        perf_payload_success = {
            "athlete_id": target_athlete_id,
            "workout_id": workout_id,
            "sport_event": "100m Sprint",
            "value": 10.22,
            "unit": "seconds",
            "feedback": "Excellent block exit. Keep hips high.",
            "recorded_at": "2026-07-10",
            "date": "2026-07-10"
        }
        resp_perf, status = make_request(f"{BASE_URL}/performances/", "POST", perf_payload_success, token=coach_token)
        assert status == 200, f"Failed to log performance: {status}"
        perf_id = resp_perf.get("performance_id")
        assert perf_id is not None
        print(f"  -> SUCCESS: Performance recorded linked to completed workout (ID: {perf_id}).")

        # Step 6: Athlete retrieves performance history and verifies linked data
        print("Step 6: Athlete retrieving linked performance history...")
        resp_history, status = make_request(f"{BASE_URL}/performances/athlete/{target_athlete_id}", "GET", token=athlete_token)
        assert status == 200, f"Failed to fetch history: {status}"
        assert len(resp_history) == 1
        record = resp_history[0]
        assert record["workout_id"] == workout_id
        assert record["sport_event"] == "100m Sprint"
        assert record["value"] == 10.22
        assert record["unit"] == "seconds"
        assert record["feedback"] == "Excellent block exit. Keep hips high."
        assert record["recorded_at"] == "2026-07-10"
        print("  -> SUCCESS: Performance history has correct linked fields.")

        print("=" * 70)
        print("All Workout Completion & Linked Performance tests PASSED!")
        print("=" * 70)

    finally:
        await clean_test_data()

if __name__ == "__main__":
    asyncio.run(run_tests())
