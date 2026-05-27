from appwrite.client import Client
from appwrite.services.tables_db import TablesDB
from src.config import config

def get_appwrite_client() -> Client:
    client = Client()
    client.set_endpoint(config.APPWRITE_ENDPOINT)
    client.set_project(config.APPWRITE_PROJECT_ID)
    client.set_key(config.APPWRITE_API_KEY)
    return client

def get_database() -> TablesDB:
    return TablesDB(get_appwrite_client())