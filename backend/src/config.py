from dotenv import load_dotenv
import os

load_dotenv()

class Config:
    # Appwrite
    APPWRITE_ENDPOINT: str = os.getenv("APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1")
    APPWRITE_PROJECT_ID: str = os.getenv("APPWRITE_PROJECT_ID", "")
    APPWRITE_API_KEY: str = os.getenv("APPWRITE_API_KEY", "")

    # Database
    APPWRITE_DATABASE_ID: str = os.getenv("APPWRITE_DATABASE_ID", "event_intelligence")
    COLLECTION_EVENTS: str = os.getenv("COLLECTION_EVENTS", "events")
    COLLECTION_SUMMARIES: str = os.getenv("COLLECTION_SUMMARIES", "summaries")
    COLLECTION_SCHEDULER_STATE: str = os.getenv("COLLECTION_SCHEDULER_STATE", "scheduler_state")

    # News APIs
    NEWS_API_KEY: str = os.getenv("NEWS_API_KEY", "")
    SERPER_API_KEY: str = os.getenv("SERPER_API_KEY", "")

    # AI
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # App
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    def validate(self):
        missing = []
        required = ["APPWRITE_PROJECT_ID", "APPWRITE_API_KEY", "ANTHROPIC_API_KEY"]
        for key in required:
            if not getattr(self, key):
                missing.append(key)
        if missing:
            raise ValueError(f"Missing required env vars: {', '.join(missing)}")

config = Config()