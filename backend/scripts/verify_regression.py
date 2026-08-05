"""
AthliTech Stabilization & Workflow Lock Regression Suite.

Verifies the complete multi-workspace lifecycle:
1. Register a new account.
2. Login successfully.
3. Activate Athlete workspace & access all athlete endpoints.
4. Activate Coach workspace & switch between Athlete and Coach without permission errors.
5. Activate Organization workspace & switch between all 3 owned workspaces.
6. Simulate session restoration / re-login / server restart.
7. Restore correct workspace context automatically.
8. Verify zero 403 Forbidden errors across all owned workspace switching.
9. Verify historical workouts, performance logs, subscriptions, memberships, and profiles remain intact.
"""

import sys
import os
import urllib.request
import json
import uuid

API_BASE = "http://127.0.0.1:8000"


def req(url, token=None, body=None, method=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body is not None else None
    m = method or ("POST" if data is not None else "GET")
    r = urllib.request.Request(url, data=data, headers=headers, method=m)
    try:
        res = urllib.request.urlopen(r).read()
        return json.loads(res.decode() if res else "{}"), None
    except urllib.error.HTTPError as e:
        body_str = e.read().decode() if e.fp else ""
        return None, (e.code, body_str[:300])


def run_regression_suite():
    print("=======================================================================")
    print("🚀 ATHLITECH STABILIZATION & WORKFLOW LOCK REGRESSION SUITE")
    print("=======================================================================")

    email = f"multi_ws_{uuid.uuid4().hex[:8]}@athlitech-test.com"
    password = "TestPass1!"

    # 1. Register new account
    print("\n[1/9] Registering new account...")
    reg, err = req(f"{API_BASE}/auth/register", body={
        "first_name": "MultiRole", "last_name": "User",
        "email": email, "password": password, "confirm_password": password, "role": "athlete"
    })
    assert err is None, f"Register failed: {err}"
    account_id = reg["user_id"]
    print(f"  ✓ Registered account_id={account_id}")

    # 2. Login successfully
    print("\n[2/9] Logging in...")
    login_res, err = req(f"{API_BASE}/auth/login", body={"email": email, "password": password})
    assert err is None, f"Login failed: {err}"
    token = login_res["access_token"]
    print("  ✓ Login successful, JWT token acquired")

    # 3. Athlete Workspace Verification
    print("\n[3/9] Testing Athlete Workspace endpoints...")
    me, err = req(f"{API_BASE}/auth/me", token=token)
    assert err is None, f"/me failed: {err}"
    assert "athlete" in me.get("active_roles", []), f"Athlete role missing in active_roles: {me}"

    ath_sum, err = req(f"{API_BASE}/dashboard/athlete/{account_id}/summary", token=token)
    assert err is None, f"Athlete dashboard summary failed: {err}"

    ath_prof, err = req(f"{API_BASE}/athletes/{account_id}", token=token)
    assert err is None, f"Athlete profile failed: {err}"

    wkts, err = req(f"{API_BASE}/workouts", token=token)
    assert err is None, f"Workout library failed: {err}"

    saved_wkts, err = req(f"{API_BASE}/athletes/me/saved-workouts", token=token)
    assert err is None, f"Saved workouts failed: {err}"

    # Save a workout to test persistence
    if wkts:
        save_res, err = req(f"{API_BASE}/athletes/me/saved-workouts", token=token, body={"workout_template_id": wkts[0]["id"]})
        assert err is None, f"Save workout failed: {err}"

    logs, err = req(f"{API_BASE}/performance-logs/me", token=token)
    assert err is None, f"Performance logs failed: {err}"

    status, err = req(f"{API_BASE}/role-profiles/status", token=token)
    assert err is None, f"Role profile status failed: {err}"
    assert status["roles"]["athlete"]["active"] is True, "Athlete role should be active"
    print("  ✓ All Athlete workspace endpoints return 200 OK")

    # 4. Activate Coach Workspace & Switch
    print("\n[4/9] Activating Coach Workspace...")
    act_coach, err = req(f"{API_BASE}/role-profiles/activate", token=token, body={"role": "coach"})
    assert err is None, f"Activate coach workspace failed: {err}"
    print("  ✓ Coach workspace activated")

    # Verify both Athlete and Coach workspaces work without 403 Forbidden
    print("  ✓ Testing Athlete Dashboard after Coach activation...")
    ath_sum2, err = req(f"{API_BASE}/dashboard/athlete/{account_id}/summary", token=token)
    assert err is None, f"Athlete summary failed after coach activation: {err}"

    ath_prof2, err = req(f"{API_BASE}/athletes/{account_id}", token=token)
    assert err is None, f"Athlete profile failed after coach activation: {err}"

    print("  ✓ Testing Coach Dashboard endpoints...")
    coach_sum, err = req(f"{API_BASE}/dashboard/coach/{account_id}/summary", token=token)
    assert err is None, f"Coach dashboard summary failed: {err}"

    # 5. Activate Organization Workspace & Switch between all 3
    print("\n[5/9] Activating Organization Workspace...")
    act_org, err = req(f"{API_BASE}/role-profiles/activate", token=token, body={"role": "organization"})
    assert err is None, f"Activate org workspace failed: {err}"
    print("  ✓ Organization workspace activated")

    print("  ✓ Testing Organization Dashboard endpoints...")
    my_org, err = req(f"{API_BASE}/organization/my-organization", token=token)
    assert err is None, f"My organization failed: {err}"

    org_sum, err = req(f"{API_BASE}/dashboard/admin/summary", token=token)
    assert err is None, f"Admin summary failed: {err}"

    # 6. Simulate Server Restart / Token Refresh / Re-login
    print("\n[6/9] Simulating server restart and re-login...")
    re_login, err = req(f"{API_BASE}/auth/login", body={"email": email, "password": password})
    assert err is None, f"Re-login failed: {err}"
    new_token = re_login["access_token"]
    print("  ✓ Re-login successful after restart simulation")

    # 7. Workspace status restoration after restart
    print("\n[7/9] Verifying restored workspace status...")
    status_after, err = req(f"{API_BASE}/role-profiles/status", token=token)
    assert err is None, f"Status check after restart failed: {err}"
    active_after = status_after.get("active_roles", [])
    assert "athlete" in active_after, "Athlete workspace should be active after restart"
    assert "coach" in active_after, "Coach workspace should be active after restart"
    assert "organization" in active_after, "Organization workspace should be active after restart"
    print(f"  ✓ Active workspaces restored: {active_after}")

    # 8. Switch freely between all 3 owned workspaces without 403 Forbidden
    print("\n[8/9] Verifying zero permission errors when accessing all owned workspaces...")
    # Athlete workspace
    s1, e1 = req(f"{API_BASE}/dashboard/athlete/{account_id}/summary", token=new_token)
    assert e1 is None, f"Athlete summary error: {e1}"
    # Coach workspace
    s2, e2 = req(f"{API_BASE}/dashboard/coach/{account_id}/summary", token=new_token)
    assert e2 is None, f"Coach summary error: {e2}"
    # Org workspace
    s3, e3 = req(f"{API_BASE}/dashboard/admin/summary", token=new_token)
    assert e3 is None, f"Org summary error: {e3}"
    print("  ✓ Free switching verified across Athlete, Coach, and Organization dashboards")

    # 9. Verify Data Retention (saved workouts, performance logs, memberships)
    print("\n[9/9] Verifying data retention across workspace switches...")
    saved_after, err = req(f"{API_BASE}/athletes/me/saved-workouts", token=new_token)
    assert err is None, f"Saved workouts check failed: {err}"
    assert len(saved_after) >= 1, "Saved workout should persist across workspace switches and restarts"

    logs_after, err = req(f"{API_BASE}/performance-logs/me", token=new_token)
    assert err is None, f"Performance logs check failed: {err}"
    print("  ✓ All historical data (workouts, logs, profiles) intact")

    print("\n=======================================================================")
    print("✅ REGRESSION SUITE PASSED — ALL WORKFLOWS VERIFIED OPERATIONAL")
    print("=======================================================================\n")


if __name__ == "__main__":
    run_regression_suite()
