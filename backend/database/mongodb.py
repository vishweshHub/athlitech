from motor.motor_asyncio import AsyncIOMotorClient

from core.config import MONGODB_DATABASE, MONGODB_URI

client = AsyncIOMotorClient(MONGODB_URI)

db = client[MONGODB_DATABASE]

athletes_collection = db["athletes"]
users_collection = db["users"]
roles_collection = db["roles"]
workouts_collection = db["workouts"]
performance_collection = db["performances"]
training_plans_collection = db["training_plans"]
training_weeks_collection = db["training_weeks"]
training_days_collection = db["training_days"]
sessions_collection = db["sessions"]
workout_assignments_collection = db["workout_assignments"]
workout_sessions_collection = db["workout_sessions"]
metric_definitions_collection = db["metric_definitions"]
performance_logs_collection = db["performance_logs"]
athlete_saved_workouts_collection = db["athlete_saved_workouts"]
