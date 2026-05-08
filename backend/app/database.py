import os
from pymongo import AsyncMongoClient
from beanie import init_beanie
from app.models import User, MuscleGroup, MovementPattern, Exercise, Stretch, Routine, WorkoutSession, MuscleRecovery, BodyMetric
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "fitatlas")

async def init_db():
    client = AsyncMongoClient(MONGO_URL)
    await init_beanie(
        database=client[DATABASE_NAME],
        document_models=[
            User,
            MuscleGroup,
            MovementPattern,
            Exercise,
            Stretch,
            Routine,
            WorkoutSession,
            MuscleRecovery,
            BodyMetric
        ]
    )
    print(f"Connected to MongoDB: {DATABASE_NAME}")
