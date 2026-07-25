from fastapi.testclient import TestClient

from main import app


def test_swagger_exposes_only_expected_endpoints_and_tags():
    client = TestClient(app)
    spec = client.get("/openapi.json").json()

    paths = spec["paths"]
    tags = {tag["name"] for tag in spec.get("tags", [])}

    expected_paths = {
        "/auth/register",
        "/auth/login",
        "/auth/refresh",
        "/auth/logout",
        "/auth/me",
        "/users/",
        "/users/{user_id}",
        "/users/{user_id}/role",
        "/roles/",
        "/coaches/{coach_id}/athletes",
        "/coaches/{coach_id}",
        "/athletes/{athlete_id}",
        "/athletes/{athlete_id}/assign/{coach_id}",
    }

    unexpected_paths = {
        "/register",
        "/athletes",
        "/update-weight/{name}",
        "/athletes/{athlete_id}",
    }

    # /athletes/{athlete_id} is expected; keep it in expected_paths and remove from unexpected_paths
    unexpected_paths.discard("/athletes/{athlete_id}")

    assert expected_paths.issubset(paths.keys())
    assert unexpected_paths.isdisjoint(paths.keys())

    assert {"Authentication", "Users", "Roles", "Coaches", "Athletes"}.issubset(tags)
