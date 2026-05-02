from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.database import init_db
from app.routers import exercises, routines, sessions, auth, analytics

app = FastAPI(title="FitAtlas API", version="1.0.0")
STATIC_DIR = Path(__file__).resolve().parents[1] / "static"
EXERCISE_GIFS_DIR = STATIC_DIR / "exercise-gifs"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5176",
        "http://127.0.0.1:5176",
        "https://oscarpalomino.dev",
        "https://www.oscarpalomino.dev",
        "capacitor://localhost",
        "ionic://localhost",
        "https://localhost",
        "http://localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_db()

@app.get("/")
async def root():
    return {"message": "Welcome to FitAtlas API", "status": "online"}

if EXERCISE_GIFS_DIR.exists():
    app.mount("/exercise-gifs", StaticFiles(directory=str(EXERCISE_GIFS_DIR)), name="exercise-gifs")

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(exercises.router, prefix="/exercises", tags=["Exercises"])
app.include_router(routines.router, prefix="/routines", tags=["Routines"])
app.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
