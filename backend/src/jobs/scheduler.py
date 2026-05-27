from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from appwrite.query import Query
from appwrite.id import ID
from datetime import datetime, timezone, timedelta

from src.services.appwrite_client import get_database
from src.config import config

scheduler = AsyncIOScheduler()


def start_scheduler():
    scheduler.start()
    print("[scheduler] Started")


async def restore_jobs():
    db = get_database()
    try:
        result = db.list_rows(
            database_id=config.APPWRITE_DATABASE_ID,
            table_id=config.COLLECTION_EVENTS,
            queries=[Query.equal("status", "active")]
        )
        for event in result.rows:
            await schedule_event(event.id, event.data["refresh_interval_hours"])
            print(f"[scheduler] Restored job for '{event.data['name']}'")
    except Exception as e:
        print(f"[scheduler] Could not restore jobs: {e}")


async def schedule_event(event_id: str, interval_hours: int):
    from src.jobs.processor import run_pipeline

    job_id = f"event_{event_id}"

    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)

    scheduler.add_job(
        run_pipeline,
        trigger=IntervalTrigger(hours=interval_hours),
        args=[event_id],
        id=job_id,
        replace_existing=True,
        next_run_time=datetime.now(timezone.utc) + timedelta(seconds=5),
    )

    _save_scheduler_state(event_id, job_id, interval_hours)
    print(f"[scheduler] Scheduled event {event_id} every {interval_hours}h")


async def reschedule_event(event_id: str, new_interval_hours: int):
    await schedule_event(event_id, new_interval_hours)


async def cancel_event(event_id: str):
    job_id = f"event_{event_id}"
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
        print(f"[scheduler] Cancelled job for event {event_id}")


def _save_scheduler_state(event_id: str, job_id: str, interval_hours: int):
    db = get_database()
    now = datetime.now(timezone.utc)
    next_run = now + timedelta(hours=interval_hours)

    try:
        existing = db.list_rows(
            database_id=config.APPWRITE_DATABASE_ID,
            table_id=config.COLLECTION_SCHEDULER_STATE,
            queries=[Query.equal("event_id", event_id)]
        )
        data = {
            "event_id": event_id,
            "job_id": job_id,
            "next_run_at": next_run.isoformat(),
            "last_run_status": "pending",
        }
        if existing.rows:
            db.update_row(
                database_id=config.APPWRITE_DATABASE_ID,
                table_id=config.COLLECTION_SCHEDULER_STATE,
                row_id=existing.rows[0].id,
                data=data
            )
        else:
            db.create_row(
                database_id=config.APPWRITE_DATABASE_ID,
                table_id=config.COLLECTION_SCHEDULER_STATE,
                row_id=ID.unique(),
                data=data
            )
    except Exception as e:
        print(f"[scheduler] Could not save state: {e}")