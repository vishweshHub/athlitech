from motor.motor_asyncio import AsyncIOMotorClient

from core.config import MONGODB_DATABASE, MONGODB_URI

client = AsyncIOMotorClient(MONGODB_URI)

db = client[MONGODB_DATABASE]

athletes_collection = db["athletes"]
users_collection = db["users"]
roles_collection = db["roles"]
workouts_collection = db["workouts"]
