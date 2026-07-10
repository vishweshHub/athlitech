"""
test_coach_assignment.py
-------------------------
Integration tests for improved Coach Assignment management.
Verifies that:
1. Admin can assign a coach to an athlete.
2. Admin can change an assigned coach to a different coach.
3. Admin can remove a coach assignment completely.
"""

import json
import urllib.request
import urllib.error
import asyncio
from bson.objectid import ObjectId
from database.mongodb import users_collection, athletes_collection
from core.security import hash_password

# Test credentials
TEST_ADMIN_EMAIL = "assign-admin@example.com"
TEST_COACH_A_EMAIL = "assign-coach-a@example.com"
TEST_COACH_B_EMAIL = "assign-coach-b@example.com"
TEST_ATHLETE_EMAIL = "assign-athlete@example.com"

BASE_URL = "http://127.0.0.1:8000"

async def setup_test_users():
    await clean_test_users()

    # Create admin
    admin_id = str(ObjectId())
    await users_collection.insert_one({
        "_id": ObjectId(admin_id),
        "name": "Assign Admin",
        "email": TEST_ADMIN_EMAIL,
        "role": "admin",
        "hashed_password": hash_password("Admin@2024!")
    })

    # Create Coach A
    coach_a_id = str(ObjectId())
    await users_collection.insert_one({
        "_id": ObjectId(coach_a_id),
        "name": "Assign Coach A",
        "email": TEST_COACH_A_EMAIL,
        "role": "coach",
        "coach_id": "coach-a-id",
        "hashed_password": hash_password("Coach#99ab")
    })

    # Create Coach B
    coach_b_id = str(ObjectId())
    await users_collection.insert_one({
        "_id": ObjectId(coach_b_id),
        "name": "Assign Coach B",
        "email": TEST_COACH_B_EMAIL,
        "role": "coach",
        "coach_id": "coach-b-id",
        "hashed_password": hash_password("Coach#99ab")
    })

    # Create Athlete
    athlete_id = str(ObjectId())
    await users_collection.insert_one({
        "_id": ObjectId(athlete_id),
        "name": "Assign Athlete",
        "email": TEST_ATHLETE_EMAIL,
        "role": "athlete",
        "hashed_password": hash_password("Athlete1$x")
    })

    return admin_id, "coach-a-id", "coach-b-id", athlete_id

async def clean_test_users():
    await users_collection.delete_many({"email": {"$in": [TEST_ADMIN_EMAIL, TEST_COACH_A_EMAIL, TEST_COACH_B_EMAIL, TEST_ATHLETE_EMAIL]}})
    await athletes_collection.delete_many({"name": "Assign Athlete"})

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
    print("Running Coach Assignment Management Integration Tests...")
    print("=" * 70)

    admin_id, coach_a_id, coach_b_id, athlete_id = await setup_test_users()

    try:
        # Obtain JWT token for Admin
        print("Obtaining JWT token for test admin...")
        admin_token = make_request(
            f"{BASE_URL}/auth/login", 
            "POST", 
            {"email": TEST_ADMIN_EMAIL, "password": "Admin@2024!"}
        )[0]["access_token"]

        # 1. Admin assigns Coach A to Athlete -> 200 OK
        print("1. Admin assigning Coach A to Athlete...")
        resp, status = make_request(
            f"{BASE_URL}/athletes/{athlete_id}/assign/{coach_a_id}",
            "POST",
            token=admin_token
        )
        assert status == 200
        print("  -> SUCCESS: Coach A assigned.")

        # Verify athlete's coach is Coach A
        resp_ath, status = make_request(
            f"{BASE_URL}/athletes/{athlete_id}",
            token=admin_token
        )
        assert resp_ath["coach_id"] == coach_a_id
        print(f"  -> SUCCESS: Confirmed current coach is {coach_a_id}.")

        # 2. Admin changes assigned coach to Coach B -> 200 OK
        print("2. Admin changing assigned coach to Coach B...")
        resp, status = make_request(
            f"{BASE_URL}/athletes/{athlete_id}/assign/{coach_b_id}",
            "POST",
            token=admin_token
        )
        assert status == 200
        print("  -> SUCCESS: Coach changed to Coach B.")

        # Verify athlete's coach is Coach B
        resp_ath, status = make_request(
            f"{BASE_URL}/athletes/{athlete_id}",
            token=admin_token
        )
        assert resp_ath["coach_id"] == coach_b_id
        print(f"  -> SUCCESS: Confirmed current coach is now {coach_b_id}.")

        # 3. Admin removes coach assignment -> 200 OK
        print("3. Admin removing coach assignment...")
        resp, status = make_request(
            f"{BASE_URL}/athletes/{athlete_id}/assign",
            "DELETE",
            token=admin_token
        )
        assert status == 200
        print("  -> SUCCESS: Assignment removed.")

        # Verify athlete's coach is now None
        resp_ath, status = make_request(
            f"{BASE_URL}/athletes/{athlete_id}",
            token=admin_token
        )
        assert resp_ath["coach_id"] is None
        print("  -> SUCCESS: Confirmed athlete has no assigned coach.")

        print("=" * 70)
        print("All Coach Assignment integration tests PASSED!")
        print("=" * 70)

    finally:
        await clean_test_users()

if __name__ == "__main__":
    asyncio.run(run_tests())
