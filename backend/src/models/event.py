from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class EventType(str, Enum):
    box_office = "box_office"
    election = "election"
    sports = "sports"
    custom = "custom"


class EventStatus(str, Enum):
    active = "active"
    completed = "completed"
    archived = "archived"


# Default refresh intervals (hours) per event type
DEFAULT_INTERVALS: dict[EventType, int] = {
    EventType.box_office: 24,
    EventType.election: 3,
    EventType.sports: 1,
    EventType.custom: 12,
}


class CreateEventRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    type: EventType
    end_condition: Optional[str] = Field(None, max_length=1000)
    refresh_interval_hours: Optional[int] = Field(None, ge=1, le=8760)  # 1hr - 1 year

    def resolved_interval(self) -> int:
        """Use user-provided interval or fall back to type default."""
        return self.refresh_interval_hours or DEFAULT_INTERVALS[self.type]


class UpdateEventRequest(BaseModel):
    refresh_interval_hours: Optional[int] = Field(None, ge=1, le=168)
    end_condition: Optional[str] = Field(None, max_length=1000)
    status: Optional[EventStatus] = None


class EventResponse(BaseModel):
    id: str
    name: str
    type: EventType
    status: EventStatus
    refresh_interval_hours: int
    end_condition: Optional[str]
    search_queries: List[str]
    user_id: str
    created_at: str
    completed_at: Optional[str]


class SummaryResponse(BaseModel):
    id: str
    event_id: str
    headline: str
    detail: str
    progress_value: Optional[float]
    progress_label: Optional[str]
    should_archive: bool
    created_at: str