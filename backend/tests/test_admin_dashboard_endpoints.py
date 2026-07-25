"""
test_admin_dashboard_endpoints.py
----------------------------------
Integration tests for new Admin Dashboard endpoints:
1. GET /workouts/ (admin only)
2. GET /performances/ (admin only)
"""

import json
import urllib.request
import urllib.error
import asyncio
from bson.objectid import ObjectId
from database.mongodb import users_collection
from core.security import hash_password

# Test credentials
TEST_ADMIN_EMAIL = "dash-admin@example.com"
TEST_COACH_EMAIL = "dash-coach@example.com"
BASE_URL = "http://127.0.0.1:8000"

async def setup_test_users():
    await clean_test_users()

    # Create admin
    admin_id = str(ObjectId())
    await users_collection.insert_one({
        "_id": ObjectId(admin_id),
        "name": "Dash Admin",
        "email": TEST_ADMIN_EMAIL,
        "role": "admin",
        "hashed_password": hash_password("Admin@2024!")
    })

    # Create Coach
    coach_id = str(ObjectId())
    await users_collection.insert_one({
        "_id": ObjectId(coach_id),
        "name": "Dash Coach",
        "email": TEST_COACH_EMAIL,
        "role": "coach",
        "coach_id": "dash-coach-id",
        "hashed_password": hash_password("Coach#99ab")
    })

    return admin_id, coach_id

async def clean_test_users():
    await users_collection.delete_many({"email": {"$in": [TEST_ADMIN_EMAIL, TEST_COACH_EMAIL]}})

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
    print("Running Admin Dashboard Endpoints Integration Tests...")
    print("=" * 70)

    admin_id, coach_id = await setup_test_users()

    try:
        # Obtain JWT tokens
        print("Obtaining JWT tokens...")
        admin_token = make_request(
            f"{BASE_URL}/auth/login", 
            "POST", 
            {"email": TEST_ADMIN_EMAIL, "password": "Admin@2024!"}
        )[0]["access_token"]

        coach_token = make_request(
            f"{BASE_URL}/auth/login", 
            "POST", 
            {"email": TEST_COACH_EMAIL, "password": "Coach#99ab"}
        )[0]["access_token"]

        # 1. Admin GET /workouts/ -> should succeed (200)
        print("1. Admin fetching all workouts...")
        resp, status = make_request(
            f"{BASE_URL}/workouts/",
            token=admin_token
        )
        assert status == 200
        assert isinstance(resp, list)
        print("  -> SUCCESS: Admin retrieved workouts.")

        # 2. Coach GET /workouts/ -> should return 403 Forbidden
        print("2. Coach trying to fetch all workouts...")
        try:
            make_request(
                f"{BASE_URL}/workouts/",
                token=coach_token
            )
            assert False, "Expected 403 Forbidden but endpoint succeeded"
        except urllib.error.HTTPError as e:
            assert e.code == 403
            print("  -> SUCCESS: Correctly blocked Coach from fetching all workouts.")

        # 3. Admin GET /performances/ -> should succeed (200)
        print("3. Admin fetching all performances...")
        resp, status = make_request(
            f"{BASE_URL}/performances/",
            token=admin_token
        )
        assert status == 200
        assert isinstance(resp, list)
        print("  -> SUCCESS: Admin retrieved performance list.")

        # 4. Coach GET /performances/ -> should return 403 Forbidden
        print("4. Coach trying to fetch all performances...")
        try:
            make_request(
                f"{BASE_URL}/performances/",
                token=coach_token
            )
            assert False, "Expected 403 Forbidden but endpoint succeeded"
        except urllib.error.HTTPError as e:
            assert e.code == 403
            print("  -> SUCCESS: Correctly blocked Coach from fetching all performance records.")

        print("=" * 70)
        print("All Admin Dashboard endpoints tests PASSED!")
        print("=" * 70)

    finally:
        await clean_test_users()

if __name__ == "__main__":
    asyncio.run(run_tests())
