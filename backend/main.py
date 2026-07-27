from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import FRONTEND_ORIGINS
from routes.auth_routes import router as auth_router
from routes.athlete_routes import router as athlete_router
from routes.user_routes import router as user_router
from routes.role_routes import router as role_router
from routes.workout_routes import router as workout_router
from services.role_service import seed_default_roles
from services.user_seed_service import seed_demo_users
from services.workout_seed_service import seed_demo_workouts
from routes.performance_routes import router as performance_router
from routes.dashboard_routes import router as dashboard_router
from routes.profile_routes import router as profile_router
from routes.training_plan_routes import router as training_plan_router
from routes.session_routes import router as session_router
from routes.workout_assignment_routes import router as workout_assignment_router
from routes.today_training_routes import router as today_training_router

app = FastAPI(
    title="AthliTech API",
    openapi_tags=[
        {"name": "Authentication"},
        {"name": "Users"},
        {"name": "Roles"},
        {"name": "Coaches"},
        {"name": "Athletes"},
        {"name": "Performance"},
        {"name": "Workouts"},
        {"name": "Dashboard"},
        {"name": "Profile"},
        {"name": "Training Plans"},
        {"name": "Sessions"},
        {"name": "Workout Assignments"},
        {"name": "Today's Training"},
    ]
)

app.add_middleware(
    CORSMiddleware, 
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(athlete_router)
app.include_router(user_router)
app.include_router(role_router)
app.include_router(workout_router)
app.include_router(performance_router)
app.include_router(dashboard_router)
app.include_router(profile_router)
app.include_router(training_plan_router)
app.include_router(session_router)
app.include_router(workout_assignment_router)
app.include_router(today_training_router)





@app.on_event("startup")
async def startup_event():
    await seed_default_roles()
    await seed_demo_users()
    await seed_demo_workouts()



@app.get("/")
def home():
    return {"message": "AthliTech API Running"}
