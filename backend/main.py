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
from routes.performance_routes import router as performance_router

app = FastAPI()

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


@app.on_event("startup")
async def startup_event():
    await seed_default_roles()
    await seed_demo_users()


@app.get("/")
def home():
    return {"message": "AthliTech API Running"}
