from database.mongodb import db
from datetime import datetime

profiles_collection = db["profiles"]

class ProfileRepository:
    @property
    def collection(self):
        return profiles_collection

    async def get_profile_by_user_id(self, user_id: str) -> dict | None:
        return await self.collection.find_one({"user_id": user_id})

    async def save_profile(self, user_id: str, role: str, profile_data: dict) -> dict:
        now = datetime.utcnow()
        existing = await self.get_profile_by_user_id(user_id)
        
        doc_key = "athlete_data" if role == "athlete" else "coach_data"
        
        if existing:
            update_fields = {
                doc_key: profile_data,
                "role": role,
                "updated_at": now,
            }
            await self.collection.update_one(
                {"user_id": user_id},
                {"$set": update_fields}
            )
            return await self.get_profile_by_user_id(user_id)
        else:
            new_doc = {
                "user_id": user_id,
                "role": role,
                doc_key: profile_data,
                "visibility": {
                    "bio_is_public": False,
                    "stats_is_public": False,
                },
                "created_at": now,
                "updated_at": now,
            }
            await self.collection.insert_one(new_doc)
            return new_doc


profile_repository = ProfileRepository()
