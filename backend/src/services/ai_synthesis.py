from google import genai
from google.genai import types
import json
from typing import List, Optional
from src.config import config
from src.models.event import EventType

client = genai.Client(api_key=config.GEMINI_API_KEY)


async def generate_search_queries(event_name: str, event_type: EventType) -> List[str]:
    """Ask Gemini to generate the best news search queries for this event."""
    prompt = f"""Generate news search queries for this event.
Event: {event_name}
Type: {event_type.value}

Return ONLY a JSON array of 3-4 short search strings, no other text, no markdown.
Example: ["Dhurandhar 2 box office collection", "Dhurandhar 2 week 2 earnings"]"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )
    raw = response.text.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return [event_name]


async def synthesize_summary(
    event_name: str,
    event_type: EventType,
    end_condition: Optional[str],
    articles: List[dict],
    previous_summary: Optional[str] = None,
) -> dict:
    """
    Core synthesis: takes raw articles, returns structured summary JSON.
    The 'so what' layer — numbers, context, progress toward a goal.
    """
    articles_text = "\n\n".join([
        f"Title: {a['title']}\nSnippet: {a['description']}\nDate: {a['published_at']}"
        for a in articles
    ])

    previous_context = (
        f"\n\nPrevious summary for continuity:\n{previous_summary}"
        if previous_summary else ""
    )

    end_condition_text = (
        f"\n\nArchive this event if: {end_condition}"
        if end_condition else ""
    )

    prompt = f"""You are an event intelligence analyst.
Given news articles about an event, produce a concise structured JSON summary.

Be specific with numbers and comparisons. Don't say "doing well" — say "needs 43Cr more to surpass Stree 2".
For box office: include collection figures, comparison to benchmarks, weekly trend.
For elections: include vote share, seat counts, leading party margin.
For sports: include scores, standings, key moments.

Return ONLY valid JSON with exactly these keys, no markdown, no code fences:
{{
  "headline": "One punchy sentence with the key number or status (max 100 chars)",
  "detail": "2-3 sentence paragraph with full context and so-what analysis",
  "progress_value": null or a 0-100 float if there is a measurable goal,
  "progress_label": null or a short label like "387Cr of 445Cr target",
  "should_archive": true or false
}}

Event: {event_name}
Type: {event_type.value}{end_condition_text}{previous_context}

Latest articles:
{articles_text}"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )
    raw = response.text.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {
            "headline": f"Update available for {event_name}",
            "detail": raw[:500],
            "progress_value": None,
            "progress_label": None,
            "should_archive": False,
        }