from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
db_name = os.getenv("DB_NAME")
# Trim accidental whitespace around the env value
if isinstance(MONGO_URI, str):
    MONGO_URI = MONGO_URI.strip()

client = AsyncIOMotorClient(MONGO_URI)
db = client[db_name]
users_collection = db["users"]
sessions_collection = db["sessions"]
conversations_collection = db["conversations"]
rag_documents_collection = db["rag_documents"]  # New collection for RAG


# Optional: Create indexes for better performance
async def create_indexes():
    """Create database indexes for optimal query performance"""
    try:
        # Users collection indexes
        await users_collection.create_index("email", unique=True)
        await users_collection.create_index("username", unique=True)
        
        # Conversations collection indexes
        await conversations_collection.create_index([("user_id", 1), ("updated_at", -1)])
        
        # RAG documents collection indexes
        await rag_documents_collection.create_index([("user_id", 1), ("is_latest", -1)])
        await rag_documents_collection.create_index([("user_id", 1), ("uploaded_at", -1)])
        await rag_documents_collection.create_index([("user_id", 1), ("file_name", 1)])
        
        print("✅ Database indexes created successfully")
    except Exception as e:
        print(f"⚠️ Error creating indexes: {e}")