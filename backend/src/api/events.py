from fastapi import APIRouter, HTTPException, Header
from typing import List, Optional
import json
from appwrite.query import Query
from appwrite.id import ID

from src.models.event import (
    CreateEventRequest, UpdateEventRequest,
    EventResponse, SummaryResponse, EventStatus
)
from src.services.appwrite_client import get_database
from src.config import config

router = APIRouter(prefix="/events", tags=["events"])


def _require_user(x_user_id: Optional[str]) -> str:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")
    return x_user_id


def _doc_to_event(doc) -> EventResponse:
    return EventResponse(
        id=doc.id,
        name=doc.data["name"],
        type=doc.data["type"],
        status=doc.data["status"],
        refresh_interval_hours=doc.data["refresh_interval_hours"],
        end_condition=doc.data.get("end_condition"),
        search_queries=json.loads(doc.data.get("search_queries", "[]")),
        user_id=doc.data["user_id"],
        created_at=str(doc.createdat),
        completed_at=doc.data.get("completed_at"),
    )


@router.get("/", response_model=List[EventResponse])
async def list_events(x_user_id: Optional[str] = Header(None)):
    user_id = _require_user(x_user_id)
    db = get_database()
    result = db.list_rows(
        database_id=config.APPWRITE_DATABASE_ID,
        table_id=config.COLLECTION_EVENTS,
        queries=[Query.equal("user_id", user_id)]
    )
    return [_doc_to_event(doc) for doc in result.rows]


@router.post("/", response_model=EventResponse, status_code=201)
async def create_event(
    body: CreateEventRequest,
    x_user_id: Optional[str] = Header(None)
):
    user_id = _require_user(x_user_id)
    db = get_database()

    from src.services.ai_synthesis import generate_search_queries
    queries = await generate_search_queries(body.name, body.type)

    doc = db.create_row(
        database_id=config.APPWRITE_DATABASE_ID,
        table_id=config.COLLECTION_EVENTS,
        row_id=ID.unique(),
        data={
            "name": body.name,
            "type": body.type.value,
            "status": EventStatus.active.value,
            "refresh_interval_hours": body.resolved_interval(),
            "end_condition": body.end_condition,
            "search_queries": json.dumps(queries),
            "user_id": user_id,
        }
    )

    from src.jobs.scheduler import schedule_event
    await schedule_event(doc.id, body.resolved_interval())

    return _doc_to_event(doc)


@router.patch("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    body: UpdateEventRequest,
    x_user_id: Optional[str] = Header(None)
):
    user_id = _require_user(x_user_id)
    db = get_database()

    existing = db.get_row(
        database_id=config.APPWRITE_DATABASE_ID,
        table_id=config.COLLECTION_EVENTS,
        row_id=event_id
    )
    if existing.data["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your event")

    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    doc = db.update_row(
        database_id=config.APPWRITE_DATABASE_ID,
        table_id=config.COLLECTION_EVENTS,
        row_id=event_id,
        data=update_data
    )

    if body.refresh_interval_hours:
        from src.jobs.scheduler import reschedule_event
        await reschedule_event(event_id, body.refresh_interval_hours)

    return _doc_to_event(doc)


@router.delete("/{event_id}", status_code=204)
async def delete_event(
    event_id: str,
    x_user_id: Optional[str] = Header(None)
):
    user_id = _require_user(x_user_id)
    db = get_database()

    existing = db.get_row(
        database_id=config.APPWRITE_DATABASE_ID,
        table_id=config.COLLECTION_EVENTS,
        row_id=event_id
    )
    if existing.data["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your event")

    from src.jobs.scheduler import cancel_event
    await cancel_event(event_id)

    db.delete_row(
        database_id=config.APPWRITE_DATABASE_ID,
        table_id=config.COLLECTION_EVENTS,
        row_id=event_id
    )


@router.post("/{event_id}/refresh", status_code=202)
async def force_refresh(
    event_id: str,
    x_user_id: Optional[str] = Header(None)
):
    user_id = _require_user(x_user_id)
    db = get_database()

    existing = db.get_row(
        database_id=config.APPWRITE_DATABASE_ID,
        table_id=config.COLLECTION_EVENTS,
        row_id=event_id
    )
    if existing.data["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your event")

    from src.jobs.processor import run_pipeline
    import asyncio
    asyncio.create_task(run_pipeline(event_id))

    return {"message": "Refresh triggered", "event_id": event_id}


@router.get("/{event_id}/summaries", response_model=List[SummaryResponse])
async def get_summaries(
    event_id: str,
    x_user_id: Optional[str] = Header(None)
):
    user_id = _require_user(x_user_id)
    db = get_database()

    existing = db.get_row(
        database_id=config.APPWRITE_DATABASE_ID,
        table_id=config.COLLECTION_EVENTS,
        row_id=event_id
    )
    if existing.data["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your event")

    result = db.list_rows(
        database_id=config.APPWRITE_DATABASE_ID,
        table_id=config.COLLECTION_SUMMARIES,
        queries=[
            Query.equal("event_id", event_id),
            Query.order_desc("$createdAt"),
            Query.limit(20)
        ]
    )

    return [
        SummaryResponse(
            id=doc.id,
            event_id=doc.data["event_id"],
            headline=doc.data["headline"],
            detail=doc.data["detail"],
            progress_value=doc.data.get("progress_value"),
            progress_label=doc.data.get("progress_label"),
            should_archive=doc.data.get("should_archive", False),
            created_at=str(doc.createdat),
        )
        for doc in result.rows
    ]