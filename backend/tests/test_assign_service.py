import asyncio


class FakeResult:
    def __init__(self, matched=1, modified=1):
        self.matched_count = matched
        self.modified_count = modified


class FakeCollection:
    def __init__(self, initial=None):
        self.data = initial or {}

    async def find_one(self, query):
        for doc in self.data.values():
            if all(doc.get(k) == v for k, v in query.items()):
                return doc
        return None

    async def insert_one(self, document):
        self.data[str(len(self.data) + 1)] = document
        return type("Result", (), {"inserted_id": len(self.data)})()

    async def update_one(self, query, update):
        for doc in self.data.values():
            if all(doc.get(k) == v for k, v in query.items()):
                set_ops = update.get("$set", {})
                doc.update(set_ops)
                return FakeResult(matched=1, modified=1)
        return FakeResult(matched=0, modified=0)


async def run_tests():
    from fastapi import HTTPException

    from services import athlete_service

    athlete_id = "ath-123"
    coach_id = "coach-abc"
    another_coach_id = "coach-def"

    fake_athletes = {"a1": {"athlete_id": athlete_id, "coach_id": None}}
    fake_users = {
        "u1": {"_id": "u1", "role": "coach", "coach_id": coach_id},
        "u2": {"_id": "u2", "role": "coach", "coach_id": another_coach_id},
    }

    athlete_service.athletes_collection = FakeCollection(fake_athletes)
    athlete_service.users_collection = FakeCollection(fake_users)

    res1 = await athlete_service.assign_athlete_to_coach(athlete_id, coach_id)
    print("res1:", res1)

    res2 = await athlete_service.assign_athlete_to_coach(athlete_id, coach_id)
    print("res2:", res2)

    other_athlete = {"athlete_id": "ath-456", "coach_id": another_coach_id}
    athlete_service.athletes_collection.data["a2"] = other_athlete
    try:
        await athlete_service.assign_athlete_to_coach("ath-456", coach_id)
    except HTTPException as e:
        print("conflict:", e.status_code, e.detail)

    try:
        await athlete_service.assign_athlete_to_coach("nope", coach_id)
    except HTTPException as e:
        print("invalid athlete:", e.status_code, e.detail)

    try:
        await athlete_service.assign_athlete_to_coach(athlete_id, "no-coach")
    except HTTPException as e:
        print("invalid coach:", e.status_code, e.detail)

    # Test overwrite by admin
    res_overwrite = await athlete_service.assign_athlete_to_coach("ath-456", coach_id, overwrite=True)
    print("res_overwrite:", res_overwrite)

    # Test auto-create when athlete not in athletes_collection but exists in user registry
    fake_users.update({
        "u3": {"_id": "ath-new", "name": "New Athlete", "role": "athlete"}
    })
    res_autocreate = await athlete_service.assign_athlete_to_coach("ath-new", coach_id)
    print("res_autocreate:", res_autocreate)


if __name__ == '__main__':
    asyncio.run(run_tests())
