import json
from appwrite.id import ID
from appwrite.query import Query

from src.services.appwrite_client import get_database
from src.services.news_fetcher import fetch_articles
from src.services.ai_synthesis import synthesize_summary
from src.models.event import EventType, EventStatus
from src.config import config


async def run_pipeline(event_id: str):
    db = get_database()

    try:
        event = db.get_row(
            database_id=config.APPWRITE_DATABASE_ID,
            table_id=config.COLLECTION_EVENTS,
            row_id=event_id
        )
    except Exception as e:
        print(f"[pipeline] Could not load event {event_id}: {e}")
        return

    if event.data["status"] != EventStatus.active.value:
        print(f"[pipeline] Skipping {event_id} — status is {event.data['status']}")
        return

    queries = json.loads(event.data.get("search_queries", "[]"))
    event_type = EventType(event.data["type"])

    articles = await fetch_articles(queries, event.data["name"])
    if not articles:
        print(f"[pipeline] No articles found for event '{event.data['name']}'")
        _update_scheduler_state(db, event_id, status="failed", error="No articles found")
        return

    previous_summary = _get_latest_summary_text(db, event_id)

    try:
        result = await synthesize_summary(
            event_name=event.data["name"],
            event_type=event_type,
            end_condition=event.data.get("end_condition"),
            articles=articles,
            previous_summary=previous_summary,
        )
    except Exception as e:
        print(f"[pipeline] AI synthesis failed for {event_id}: {e}")
        _update_scheduler_state(db, event_id, status="failed", error=str(e))
        return

    db.create_row(
        database_id=config.APPWRITE_DATABASE_ID,
        table_id=config.COLLECTION_SUMMARIES,
        row_id=ID.unique(),
        data={
            "event_id": event_id,
            "headline": result.get("headline", ""),
            "detail": result.get("detail", ""),
            "progress_value": result.get("progress_value"),
            "progress_label": result.get("progress_label"),
            "should_archive": result.get("should_archive", False),
            "raw_articles": json.dumps(articles),
        }
    )

    print(f"[pipeline] Summary saved for '{event.data['name']}': {result['headline']}")

    if result.get("should_archive"):
        db.update_row(
            database_id=config.APPWRITE_DATABASE_ID,
            table_id=config.COLLECTION_EVENTS,
            row_id=event_id,
            data={"status": EventStatus.archived.value}
        )
        from src.jobs.scheduler import cancel_event
        await cancel_event(event_id)
        print(f"[pipeline] Event '{event.data['name']}' auto-archived")

    _update_scheduler_state(db, event_id, status="success")


def _get_latest_summary_text(db, event_id: str):
    try:
        result = db.list_rows(
            database_id=config.APPWRITE_DATABASE_ID,
            table_id=config.COLLECTION_SUMMARIES,
            queries=[
                Query.equal("event_id", event_id),
                Query.order_desc("$createdAt"),
                Query.limit(1)
            ]
        )
        if result.rows:
            return result.rows[0].data.get("detail")
    except Exception:
        pass
    return None


def _update_scheduler_state(db, event_id: str, status: str, error: str = None):
    from datetime import datetime, timezone
    try:
        existing = db.list_rows(
            database_id=config.APPWRITE_DATABASE_ID,
            table_id=config.COLLECTION_SCHEDULER_STATE,
            queries=[Query.equal("event_id", event_id)]
        )
        data = {
            "last_run_at": datetime.now(timezone.utc).isoformat(),
            "last_run_status": status,
            "error_message": error,
        }
        if existing.rows:
            db.update_row(
                database_id=config.APPWRITE_DATABASE_ID,
                table_id=config.COLLECTION_SCHEDULER_STATE,
                row_id=existing.rows[0].id,
                data=data
            )
    except Exception as e:
        print(f"[pipeline] Could not update scheduler state: {e}")