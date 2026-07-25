from scripts.seed_workout_library import seed_workouts

async def seed_demo_workouts() -> None:
    await seed_workouts()
