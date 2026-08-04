import pytest
import uuid
from schemas.auth_schema import RegisterRequest, UserLogin
from services.auth_service import register_user, login_user, get_current_user
from routes.role_profile_routes import get_role_profile_status, activate_role_profile, ActivateRoleRequest


@pytest.mark.anyio
async def test_role_activation_and_status():
    email = f"role_hub_user_{uuid.uuid4().hex[:6]}@example.com"
    reg_req = RegisterRequest(
        first_name="Hub",
        last_name="User",
        email=email,
        password="SecurePassword123!",
        confirm_password="SecurePassword123!",
        role="athlete"
    )
    reg_res = await register_user(reg_req)
    current_user = {
        "id": reg_res["user_id"],
        "email": email,
        "name": "Hub User",
        "role": "athlete"
    }

    # Test GET /role-profiles/status
    status_res = await get_role_profile_status(current_user=current_user)
    assert status_res["email"] == email
    assert status_res["roles"]["athlete"]["active"] is True
    assert "athlete" in status_res["active_roles"]
    assert status_res["roles"]["coach"]["active"] is False

    # Test POST /role-profiles/activate for coach
    act_res = await activate_role_profile(body=ActivateRoleRequest(role="coach"), current_user=current_user)
    assert act_res["active"] is True
    assert act_res["role"] == "coach"

    # Re-check status after activation
    status_res_after = await get_role_profile_status(current_user=current_user)
    assert status_res_after["roles"]["coach"]["active"] is True
    assert "coach" in status_res_after["active_roles"]

    # Test POST /role-profiles/activate for organization
    org_act_res = await activate_role_profile(body=ActivateRoleRequest(role="organization"), current_user=current_user)
    assert org_act_res["active"] is True
    assert org_act_res["role"] == "organization"

    status_res_org = await get_role_profile_status(current_user=current_user)
    assert status_res_org["roles"]["organization"]["active"] is True
    assert "organization" in status_res_org["active_roles"]
