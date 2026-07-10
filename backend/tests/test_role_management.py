"""
test_role_management.py
------------------------
Integration tests for enhanced Role Management.
Verifies:
1. Creating a custom role.
2. Editing permissions for custom roles.
3. Blocking edits/deletions of default roles (Admin, Coach, Athlete).
4. Deleting custom roles.
"""

import json
import urllib.request
import urllib.error
import asyncio
from bson.objectid import ObjectId
from database.mongodb import users_collection, roles_collection
from core.security import hash_password

# Test credentials
TEST_ADMIN_EMAIL = "role-admin@example.com"
BASE_URL = "http://127.0.0.1:8000"

async def setup_test_users():
    await clean_test_users()

    # Create admin
    admin_id = str(ObjectId())
    await users_collection.insert_one({
        "_id": ObjectId(admin_id),
        "name": "Role Admin",
        "email": TEST_ADMIN_EMAIL,
        "role": "admin",
        "hashed_password": hash_password("Admin@2024!")
    })

    return admin_id

async def clean_test_users():
    await users_collection.delete_many({"email": TEST_ADMIN_EMAIL})
    await roles_collection.delete_many({"name": "custom_test_role"})

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
    print("Running Role Management Integration Tests...")
    print("=" * 70)

    admin_id = await setup_test_users()

    try:
        # Obtain JWT token for Admin
        print("Obtaining JWT token for test admin...")
        admin_token = make_request(
            f"{BASE_URL}/auth/login", 
            "POST", 
            {"email": TEST_ADMIN_EMAIL, "password": "Admin@2024!"}
        )[0]["access_token"]

        # 1. Create a custom role
        print("1. Creating custom role 'custom_test_role'...")
        create_payload = {
            "name": "custom_test_role",
            "permissions": ["read:test"]
        }
        resp, status = make_request(
            f"{BASE_URL}/roles/",
            "POST",
            create_payload,
            token=admin_token
        )
        assert status == 200
        assert resp["role"]["name"] == "custom_test_role"
        print("  -> SUCCESS: Custom role created.")

        # 2. Prevent editing default role (coach)
        print("2. Trying to edit default role 'coach' permissions...")
        try:
            make_request(
                f"{BASE_URL}/roles/coach/permissions",
                "PUT",
                ["read:all"],
                token=admin_token
            )
            assert False, "Expected 400 Bad Request but endpoint succeeded"
        except urllib.error.HTTPError as e:
            assert e.code == 400
            print("  -> SUCCESS: Correctly blocked editing permissions of default 'coach' role.")

        # 3. Edit permissions of custom role
        print("3. Editing permissions of custom role...")
        resp_update, status_update = make_request(
            f"{BASE_URL}/roles/custom_test_role/permissions",
            "PUT",
            ["read:test", "write:test"],
            token=admin_token
        )
        assert status_update == 200
        # Verify permissions updated in database
        role_doc = await roles_collection.find_one({"name": "custom_test_role"})
        assert role_doc is not None
        assert "write:test" in role_doc["permissions"]
        print("  -> SUCCESS: Permissions updated successfully in DB.")

        # 4. Prevent deleting default role (athlete)
        print("4. Trying to delete default role 'athlete'...")
        try:
            make_request(
                f"{BASE_URL}/roles/athlete",
                "DELETE",
                token=admin_token
            )
            assert False, "Expected 400 Bad Request but endpoint succeeded"
        except urllib.error.HTTPError as e:
            assert e.code == 400
            print("  -> SUCCESS: Correctly blocked deletion of default 'athlete' role.")

        # 5. Delete custom role
        print("5. Deleting custom role...")
        resp_del, status_del = make_request(
            f"{BASE_URL}/roles/custom_test_role",
            "DELETE",
            token=admin_token
        )
        assert status_del == 200
        # Verify role doc is deleted
        role_doc_del = await roles_collection.find_one({"name": "custom_test_role"})
        assert role_doc_del is None
        print("  -> SUCCESS: Custom role deleted from DB.")

        print("=" * 70)
        print("All Role Management integration tests PASSED!")
        print("=" * 70)

    finally:
        await clean_test_users()

if __name__ == "__main__":
    asyncio.run(run_tests())
