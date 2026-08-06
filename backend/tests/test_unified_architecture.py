import pytest
import uuid
from models.account_model import Account
from models.organization_model import Organization
from models.membership_model import Membership
from models.role_profile_model import RoleProfile, AthleteRoleData
from schemas.auth_schema import RegisterRequest
from services.auth_service import register_user, login_user
from schemas.auth_schema import UserLogin
from core.security import decode_access_token


def test_account_model_validation():
    test_email = f"test_acc_{uuid.uuid4().hex[:6]}@example.com"
    account = Account(
        email=test_email,
        hashed_password="hashed_secret_pass",
        first_name="John",
        last_name="Doe",
    )
    assert account.email == test_email
    assert account.name == "John Doe"
    assert account.account_status == "active"


def test_organization_model_validation():
    org_id = str(uuid.uuid4())
    org = Organization(
        organization_id=org_id,
        name="Test Athletics Academy",
        slug=f"test-academy-{uuid.uuid4().hex[:4]}",
        owner_account_id="acc-owner-123"
    )
    assert org.organization_id == org_id
    assert org.status == "active"


def test_membership_and_role_profile_models():
    rp = RoleProfile(
        account_id="acc-123",
        profile_type="athlete",
        athlete_data=AthleteRoleData(sport="Sprinting", weight=75.0)
    )
    assert rp.profile_type == "athlete"
    assert rp.athlete_data.sport == "Sprinting"

    mem = Membership(
        account_id="acc-123",
        organization_id="org-456",
        role_profile_id=rp.role_profile_id,
        role="athlete"
    )
    assert mem.role == "athlete"
    assert mem.organization_id == "org-456"


@pytest.mark.anyio
async def test_dual_write_registration_and_jwt_enrichment():
    reg_email = f"dual_write_{uuid.uuid4().hex[:6]}@example.com"
    reg_req = RegisterRequest(
        first_name="Jane",
        last_name="Smith",
        email=reg_email,
        password="SecurePassword123!",
        confirm_password="SecurePassword123!",
        role="athlete"
    )
    reg_res = await register_user(reg_req)
    assert reg_res["email"] == reg_email

    # Verify Login JWT token claims contain unified context
    login_res = await login_user(UserLogin(email=reg_email, password="SecurePassword123!"))
    token = login_res["access_token"]
    payload = decode_access_token(token)

    assert payload["sub"] == reg_email
    assert "account_id" in payload
    assert "membership_id" in payload
    assert "organization_id" in payload
