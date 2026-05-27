# Event Intelligence Dashboard — Claude Code Handoff

## What this project is
A personal webapp that tracks real-world events (movie box office runs, elections, sports) and auto-generates AI summaries so the user doesn't have to manually check. Core flow: user adds an event → backend schedules periodic news fetches → Claude/Gemini synthesizes a "so what" summary → dashboard shows it.

Inspired by manually checking "how much has Dhurandhar 2 made, how far is it from surpassing X movie" repeatedly.

---

## What's already built and working

### Backend (FastAPI + Python) — FULLY WORKING ✅
Located at: `backend/`

**Stack:**
- FastAPI + uvicorn
- APScheduler (per-event recurring jobs)
- Appwrite Python SDK v1.8+ (TablesDB API)
- Google Gemini API (`google-genai` SDK, model: `gemini-2.5-flash`)
- NewsAPI + Serper for news fetching
- httpx for async HTTP

**Verified working:**
- `POST /api/events/` creates an event, generates search queries via Gemini, schedules a job
- The fetch→synthesize→store pipeline runs automatically
- Gemini returns structured JSON summaries with headline, detail, progress_value, progress_label, should_archive
- Auto-archiving when Gemini flags the event as complete
- `GET /health` returns `{"status": "ok"}`
- Server runs on `http://localhost:8000`

**To start backend:**
```bash
cd backend
source venv/bin/activate
uvicorn src.main:app --reload --port 8000
```

**Key files:**
- `src/main.py` — FastAPI app with lifespan hooks
- `src/api/events.py` — REST endpoints
- `src/jobs/processor.py` — fetch→synthesize→store pipeline
- `src/jobs/scheduler.py` — APScheduler wrapper
- `src/services/ai_synthesis.py` — Gemini calls
- `src/services/news_fetcher.py` — NewsAPI + Serper
- `src/models/event.py` — Pydantic models
- `src/config.py` — env var config

**API endpoints:**
- `GET /api/events/` — list user's events (requires `X-User-Id` header)
- `POST /api/events/` — create event
- `PATCH /api/events/{id}` — update event
- `DELETE /api/events/{id}` — delete event
- `POST /api/events/{id}/refresh` — force refresh now
- `GET /api/events/{id}/summaries` — get summary history

**Auth note:** Currently uses `X-User-Id` header (Appwrite user ID passed from frontend). No JWT verification yet — that's fine for now.

---

### Appwrite (Database) — FULLY SET UP ✅

**Project:** event-intelligence
**Region:** Singapore (sgp.cloud.appwrite.io)

**3 collections created with all attributes and indexes:**

1. **events** — name, type (box_office/election/sports/custom), status (active/completed/archived), refresh_interval_hours, end_condition, search_queries (JSON string), user_id, completed_at

2. **summaries** — event_id, headline, detail, progress_value (float), progress_label, should_archive (bool), raw_articles

3. **scheduler_state** — event_id, job_id, next_run_at, last_run_at, last_run_status (pending/running/success/failed), error_message

**Appwrite SDK note:** Using v1.8+ `TablesDB` API (NOT the old `Databases` API). Methods are `list_rows`, `create_row`, `get_row`, `update_row`, `delete_row` with `table_id` instead of `collection_id` and `row_id` instead of `document_id`. Results use `.rows` not `.get("documents")`. Row attributes use `doc.createdat` not `doc.created_at`.

**Auth:** Appwrite handles Google OAuth + Magic Link + Email/Password. Passwords are hashed with Argon2 automatically.

---

### Frontend scaffold — PARTIALLY SET UP 🔧
Located at: `frontend/`

**Stack:** React + Vite, Tailwind CSS v4, shadcn/ui (Nova preset, Radix), Zustand, TanStack Query, axios, react-router-dom, appwrite (JS SDK)

**Already installed and configured:**
- Vite with `@tailwindcss/vite` plugin
- shadcn/ui initialized (Nova/Radix preset)
- `@` path alias configured in `vite.config.js` and `jsconfig.json`
- `src/components/ui/button.jsx` and `src/lib/utils.js` created by shadcn
- All npm packages installed

**`.env.local` needs to be created** with:
```
VITE_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=<project_id>
VITE_API_BASE_URL=http://localhost:8000
```

**To start frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

---

## What needs to be built (frontend)

### Folder structure to create:
```
frontend/src/
├── components/
│   ├── events/
│   │   ├── EventCard.jsx        ← main card showing summary + progress bar
│   │   ├── EventCardSkeleton.jsx ← loading state
│   │   ├── AddEventModal.jsx    ← form to add new event
│   │   └── SummaryHistory.jsx  ← expandable list of past summaries
│   ├── layout/
│   │   ├── Navbar.jsx
│   │   └── TabBar.jsx           ← Active / Archived tabs
│   └── ui/
│       ├── Badge.jsx            ← event type badge (box_office, election etc)
│       └── ProgressBar.jsx      ← visual progress toward goal
├── pages/
│   ├── Dashboard.jsx            ← active events at top
│   ├── Archived.jsx             ← completed/archived events
│   └── Login.jsx                ← Google OAuth + Magic Link + Email
├── lib/
│   ├── appwrite.js              ← Appwrite client + auth functions
│   └── api.js                  ← axios calls to FastAPI backend
├── hooks/
│   ├── useEvents.js             ← TanStack Query hooks for events
│   └── useAuth.js               ← auth state hook
├── store/
│   └── authStore.js             ← Zustand store for user session
└── App.jsx                      ← router setup
```

### Key UI requirements:
- **Dashboard** has two sections: active events at top, a tab/section for archived below
- **EventCard** shows: event name, type badge, headline (big), detail paragraph, progress bar (if progress_value exists), "last updated" time, "next refresh in Xh", force refresh button
- **AddEventModal** has: name field, type dropdown (box_office/election/sports/custom), optional end_condition field, optional refresh_interval override (prefilled with default based on type: box_office=24h, election=3h, sports=1h, custom=12h)
- **Login page** has Google OAuth button, Magic Link (email input), and Email/Password form
- Active events at TOP of dashboard, archived/completed at BOTTOM or separate tab
- Clean, modern dark-friendly UI using shadcn components

### Auth flow:
1. User lands on `/login` if not authenticated
2. On login, Appwrite session created, user.$id stored in Zustand
3. All API calls to FastAPI include `X-User-Id: user.$id` header
4. Appwrite realtime subscription updates event cards when new summaries arrive

### Appwrite JS SDK usage:
```js
// appwrite.js
import { Client, Account, Databases, Query } from 'appwrite'
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID)
export const account = new Account(client)
export const databases = new Databases(client)
```

### Default refresh intervals (match backend):
```js
const DEFAULT_INTERVALS = {
  box_office: 24,
  election: 3,
  sports: 1,
  custom: 12,
}
```

---

## Known issues / things to fix later
1. `should_archive` is too aggressive — Gemini archives events too quickly. Need to tune the prompt in `ai_synthesis.py` to be more conservative (only archive when there's strong evidence the event is truly over, default to false)
2. No JWT verification on backend yet — `X-User-Id` header is trusted as-is. Fine for personal use, fix before making public
3. Serper API key is blank — NewsAPI only for now, Serper can be added later

---

## Dev environment
- OS: Pop!_OS 24.04 LTS
- Python: 3.12 (venv at `backend/venv/`)
- Node: v24.14.0
- Editor: VS Code with Claude Code extension
- Project path: `/media/prashastvats/DATA/LiveProjects/event-intelligence/`

backend/.env:
APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
#https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=6a1446bc00032ec57cd9
APPWRITE_API_KEY=standard_7958984c32ed7e2f2f711cbfa72e0c7324f705be1503b0cb9c39ce919930b9afa070bc558d72d5b4a1d8b3c2494a1135b496071ec27b0172d2a3246ea9e36618ecdd3598e64e3499a5e496710abe4682a20c5b3a56378780bc021624d8445855412d98be0f2e2a97f876d8d14a0e3f8c5c1d07c2824af3f0f36b99d5a21174d0
APPWRITE_DATABASE_ID=6a1447460021b159c1d5
COLLECTION_EVENTS=events
COLLECTION_SUMMARIES=summaries
COLLECTION_SCHEDULER_STATE=scheduler_state
GEMINI_API_KEY=AIzaSyDbSnfJulP16E5qsEIKozKUnCAq44HZ1XA
NEWS_API_KEY=93dd17b246f44bb8a9f89129deb96a11
SERPER_API_KEY=ce10d613a830dd157a29bf8671d98e8191e20ae8