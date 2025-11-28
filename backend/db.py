from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
# Trim accidental whitespace around the env value
if isinstance(MONGO_URI, str):
    MONGO_URI = MONGO_URI.strip()

client = AsyncIOMotorClient(MONGO_URI)
db = client["devmate_chat"]
users_collection = db["users"]
sessions_collection = db["sessions"]
conversations_collection = db["conversations"]
