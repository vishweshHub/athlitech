"""
test_deletion_consistency.py
-----------------------------
Integration tests for User Deletion Consistency requirements.
Verifies that:
1. Deleting an athlete removes all coach assignments / deletes athlete profile.
2. Deleting a coach removes assignments from athletes (setting coach_id to None).
"""

import json
import urllib.request
import urllib.error
import asyncio
from bson.objectid import ObjectId
from database.mongodb import users_collection, athletes_collection
from core.security import hash_password

# Test credentials
TEST_ADMIN_EMAIL = "delete-admin@example.com"
TEST_COACH_EMAIL = "delete-coach@example.com"
TEST_ATHLETE_EMAIL = "delete-athlete@example.com"

BASE_URL = "http://127.0.0.1:8000"

async def setup_test_users():
    await clean_test_users()

    # Create admin
    admin_id = str(ObjectId())
    await users_collection.insert_one({
        "_id": ObjectId(admin_id),
        "name": "Delete Admin",
        "email": TEST_ADMIN_EMAIL,
        "role": "admin",
        "hashed_password": hash_password("Admin@2024!")
    })

    # Create Coach
    coach_id = str(ObjectId())
    await users_collection.insert_one({
        "_id": ObjectId(coach_id),
        "name": "Delete Coach",
        "email": TEST_COACH_EMAIL,
        "role": "coach",
        "coach_id": "delete-coach-id",
        "hashed_password": hash_password("Coach#99ab")
    })

    # Create Athlete
    athlete_id = str(ObjectId())
    await users_collection.insert_one({
        "_id": ObjectId(athlete_id),
        "name": "Delete Athlete",
        "email": TEST_ATHLETE_EMAIL,
        "role": "athlete",
        "hashed_password": hash_password("Athlete1$x")
    })

    return admin_id, "delete-coach-id", athlete_id

async def clean_test_users():
    await users_collection.delete_many({"email": {"$in": [TEST_ADMIN_EMAIL, TEST_COACH_EMAIL, TEST_ATHLETE_EMAIL]}})
    await athletes_collection.delete_many({"name": "Delete Athlete"})

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
    print("Running Deletion Consistency Integration Tests...")
    print("=" * 70)

    admin_id, coach_id, athlete_id = await setup_test_users()

    try:
        # Obtain JWT token for Admin
        print("Obtaining JWT token for test admin...")
        admin_token = make_request(
            f"{BASE_URL}/auth/login", 
            "POST", 
            {"email": TEST_ADMIN_EMAIL, "password": "Admin@2024!"}
        )[0]["access_token"]

        # Assign Coach to Athlete
        print("Assigning coach to athlete first...")
        make_request(
            f"{BASE_URL}/athletes/{athlete_id}/assign/{coach_id}",
            "POST",
            token=admin_token
        )

        # Confirm assignment exists
        resp_ath, status = make_request(
            f"{BASE_URL}/athletes/{athlete_id}",
            token=admin_token
        )
        assert resp_ath["coach_id"] == coach_id
        print("  -> Coach assigned successfully.")

        # Test Case 1: Delete the Athlete user -> Athlete record should be removed
        print("1. Deleting athlete user...")
        resp_del, status_del = make_request(
            f"{BASE_URL}/users/{athlete_id}",
            "DELETE",
            token=admin_token
        )
        assert status_del == 200
        print("  -> Athlete user deleted successfully.")

        # Verify athlete profile has been deleted from athletes_collection
        profile = await athletes_collection.find_one({"athlete_id": athlete_id})
        assert profile is None, "Expected athlete profile to be deleted from athletes collection"
        print("  -> SUCCESS: Athlete profile successfully removed from database.")

        # Re-create Athlete and assign coach for Test Case 2
        print("Recreating athlete user...")
        new_athlete_id = str(ObjectId())
        await users_collection.insert_one({
            "_id": ObjectId(new_athlete_id),
            "name": "Delete Athlete",
            "email": TEST_ATHLETE_EMAIL,
            "role": "athlete",
            "hashed_password": hash_password("Athlete1$x")
        })

        # Assign Coach to the new Athlete
        print("Assigning coach to the recreated athlete...")
        make_request(
            f"{BASE_URL}/athletes/{new_athlete_id}/assign/{coach_id}",
            "POST",
            token=admin_token
        )

        # Get coach's user document to delete
        coach_user = await users_collection.find_one({"email": TEST_COACH_EMAIL})
        assert coach_user is not None
        coach_user_id = str(coach_user["_id"])

        # Test Case 2: Delete Coach -> Recreated Athlete's coach_id should become None
        print("2. Deleting coach user...")
        resp_del_coach, status_del_coach = make_request(
            f"{BASE_URL}/users/{coach_user_id}",
            "DELETE",
            token=admin_token
        )
        assert status_del_coach == 200
        print("  -> Coach user deleted successfully.")

        # Verify athlete's coach is now None
        profile_recreated = await athletes_collection.find_one({"athlete_id": new_athlete_id})
        assert profile_recreated is not None
        assert profile_recreated["coach_id"] is None, "Expected coach_id to be set to None"
        print("  -> SUCCESS: Athlete coach_id is now None ('No coach assigned').")

        print("=" * 70)
        print("All Deletion Consistency integration tests PASSED!")
        print("=" * 70)

    finally:
        await clean_test_users()

if __name__ == "__main__":
    asyncio.run(run_tests())
