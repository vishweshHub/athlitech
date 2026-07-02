import asyncio
from fastapi.testclient import TestClient
from main import app

# Fake collections similar to previous test
class FakeResult:
    def __init__(self, matched=1, modified=1):
        self.matched_count = matched
        self.modified_count = modified

class FakeCollection:
    def __init__(self, initial=None):
        self.data = initial or {}

    async def find_one(self, query):
        for v in self.data.values():
            match = True
            for k, val in query.items():
                if v.get(k) != val:
                    match = False
                    break
            if match:
                return v
        return None

    async def update_one(self, query, update):
        for k, v in self.data.items():
            if all(v.get(fk) == fv for fk, fv in query.items()):
                set_ops = update.get("$set", {})
                v.update(set_ops)
                return FakeResult(matched=1, modified=1)
        return FakeResult(matched=0, modified=0)

    async def find(self, query=None):
        query = query or {}
        for v in self.data.values():
            match = True
            for k, val in query.items():
                if v.get(k) != val:
                    match = False
                    break
            if match:
                yield v


def setup_fakes():
    from database import mongodb
    from routes import athlete_routes

    athletes = {"a1": {"athlete_id": "ath-1", "name": "A1", "sport": "s1", "weight": 70, "coach_id": None}}
    users = {"u1": {"_id": "u1", "name": "Coach1", "email": "c1@example.com", "role": "coach", "coach_id": "coach-1"}}
    fake_ath = FakeCollection(athletes)
    fake_users = FakeCollection(users)

    mongodb.athletes_collection = fake_ath
    mongodb.users_collection = fake_users

    # replace names imported in athlete_routes module
    athlete_routes.athletes_collection = fake_ath
    athlete_routes.users_collection = fake_users

    # replace names imported in athlete_service module
    from services import athlete_service
    athlete_service.athletes_collection = fake_ath
    athlete_service.users_collection = fake_users

    return


def run_tests():
    setup_fakes()
    client = TestClient(app)
    # override auth dependency so protected endpoints work
    from services.auth_service import get_current_user
    # default as coach
    app.dependency_overrides[get_current_user] = lambda: {"id": "u1", "role": "coach", "email": "c1@example.com"}

    # assign athlete to coach
    r = client.post("/athletes/ath-1/assign/coach-1")
    print("assign status", r.status_code, r.json())

    # duplicate assign
    r2 = client.post("/athletes/ath-1/assign/coach-1")
    print("duplicate assign", r2.status_code, r2.json())

    # get athlete
    ra = client.get("/athletes/ath-1")
    print("get athlete", ra.status_code, ra.json())

    # get coach athletes
    rc = client.get("/coaches/coach-1/athletes")
    print("coach athletes", rc.status_code, rc.json())

    # get coach by coach_id
    rco = client.get("/coaches/coach-1")
    print("get coach", rco.status_code, rco.json())

    # now test as admin
    app.dependency_overrides[get_current_user] = lambda: {"id": "admin1", "role": "admin", "email": "admin@example.com"}
    ra_admin = client.get("/athletes/ath-1")
    print("admin get athlete", ra_admin.status_code, ra_admin.json())

    # now test as athlete (owner)
    # update fake athlete to have owner_id matching a user
    from database import mongodb
    mongodb.athletes_collection.data["a1"]["owner_id"] = "ath_user"
    mongodb.users_collection.data["u2"] = {"_id": "u2", "name": "AthleteUser", "email": "ath@example.com", "role": "athlete", "coach_id": None}
    app.dependency_overrides[get_current_user] = lambda: {"id": "ath_user", "role": "athlete", "email": "ath@example.com"}
    ra_ath = client.get("/athletes/ath-1")
    print("athlete get own", ra_ath.status_code, ra_ath.json())

    # athlete trying to access another athlete (should be forbidden)
    mongodb.athletes_collection.data["a2"] = {"athlete_id": "ath-2", "name": "A2", "sport": "s2", "weight": 60, "coach_id": "coach-1", "owner_id": "other_user"}
    rab = client.get("/athletes/ath-2")
    print("athlete access other", rab.status_code, rab.json())


if __name__ == '__main__':
    run_tests()
