"""
test_admin_protection.py
-------------------------
Integration tests for Admin account protection.
Verifies that:
1. Admins cannot change their own role.
2. Admins cannot delete their own account.
3. Admins can successfully modify/delete other users.
"""

import json
import urllib.request
import urllib.error
import asyncio
from bson.objectid import ObjectId
from database.mongodb import users_collection
from core.security import hash_password

# Test credentials
TEST_ADMIN_EMAIL = "protect-admin@example.com"
TEST_OTHER_EMAIL = "protect-other@example.com"
BASE_URL = "http://127.0.0.1:8000"

async def setup_test_users():
    await clean_test_users()

    # Create test admin
    admin_id = str(ObjectId())
    await users_collection.insert_one({
        "_id": ObjectId(admin_id),
        "name": "Protect Admin",
        "email": TEST_ADMIN_EMAIL,
        "role": "admin",
        "hashed_password": hash_password("Admin@2024!")
    })

    # Create another test user
    other_id = str(ObjectId())
    await users_collection.insert_one({
        "_id": ObjectId(other_id),
        "name": "Protect Other",
        "email": TEST_OTHER_EMAIL,
        "role": "coach",
        "hashed_password": hash_password("Coach#99ab")
    })

    return admin_id, other_id

async def clean_test_users():
    await users_collection.delete_many({"email": {"$in": [TEST_ADMIN_EMAIL, TEST_OTHER_EMAIL]}})

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
        e.body = body
        print(f"HTTP Error {e.code}: {body}")
        raise

async def run_tests():
    print("=" * 70)
    print("Running Admin Account Protection Integration Tests...")
    print("=" * 70)

    admin_id, other_id = await setup_test_users()

    try:
        # Obtain JWT token for Admin
        print("Obtaining JWT token for test admin...")
        admin_token = make_request(
            f"{BASE_URL}/auth/login", 
            "POST", 
            {"email": TEST_ADMIN_EMAIL, "password": "Admin@2024!"}
        )[0]["access_token"]

        # 1. Admin trying to update their own role -> should return 400
        print("1. Admin trying to change their own role...")
        role_payload = {"role": "coach"}
        try:
            make_request(
                f"{BASE_URL}/users/{admin_id}/role", 
                "PUT", 
                role_payload, 
                token=admin_token
            )
            assert False, "Expected 400 Bad Request but endpoint succeeded"
        except urllib.error.HTTPError as e:
            assert e.code == 400, f"Expected 400, got {e.code}"
            assert "Admins cannot change their own role" in getattr(e, "body", "")
            print("  -> SUCCESS: Correctly blocked admin from changing their own role.")

        # 2. Admin trying to delete their own account -> should return 400
        print("2. Admin trying to delete their own account...")
        try:
            make_request(
                f"{BASE_URL}/users/{admin_id}", 
                "DELETE", 
                token=admin_token
            )
            assert False, "Expected 400 Bad Request but endpoint succeeded"
        except urllib.error.HTTPError as e:
            assert e.code == 400, f"Expected 400, got {e.code}"
            assert "Admins cannot delete their own account" in getattr(e, "body", "")
            print("  -> SUCCESS: Correctly blocked admin from deleting their own account.")

        # 3. Admin updates another user's role -> should succeed
        print("3. Admin updating another user's role...")
        other_role_payload = {"role": "athlete"}
        resp, status = make_request(
            f"{BASE_URL}/users/{other_id}/role", 
            "PUT", 
            other_role_payload, 
            token=admin_token
        )
        assert status == 200
        assert resp["role"] == "athlete"
        print("  -> SUCCESS: Admin updated other user's role.")

        # 4. Admin deletes another user's account -> should succeed
        print("4. Admin deleting another user's account...")
        resp, status = make_request(
            f"{BASE_URL}/users/{other_id}", 
            "DELETE", 
            token=admin_token
        )
        assert status == 200
        assert resp["message"] == "User deleted successfully"
        print("  -> SUCCESS: Admin deleted other user's account.")

        print("=" * 70)
        print("All Admin Protection integration tests PASSED!")
        print("=" * 70)

    finally:
        await clean_test_users()

if __name__ == "__main__":
    asyncio.run(run_tests())
