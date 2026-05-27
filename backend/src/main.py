from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from src.api.events import router as events_router
from src.jobs.scheduler import start_scheduler, restore_jobs


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    start_scheduler()
    await restore_jobs()
    yield
    # Shutdown — nothing needed, APScheduler stops cleanly


app = FastAPI(
    title="Event Intelligence API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        # Production — update with your actual Vercel URL
        "https://ai-event-intelligence.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}