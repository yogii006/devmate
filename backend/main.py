# main.py
from fastapi import FastAPI, HTTPException, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from auth import hash_password, verify_password, create_access_token, decode_access_token
from bson import ObjectId
import json

# Centralized DB client
from db import users_collection, sessions_collection
from src.graph import sync_graph  # your LangGraph instance

# ---------------------------
# FastAPI setup
# ---------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ---------------------------
# Schemas
# ---------------------------
class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class MessageRequest(BaseModel):
    message: str

# ---------------------------
# Auth Endpoints
# ---------------------------
@app.post("/signup")
async def signup(user: UserCreate):
    existing = await users_collection.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed_pwd = hash_password(user.password)
    result = await users_collection.insert_one({"username": user.username, "password_hash": hashed_pwd})
    return {"msg": "User created successfully", "user_id": str(result.inserted_id)}

@app.post("/login")
async def login(user: UserLogin):
    db_user = await users_collection.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": db_user["username"]})
    return {"access_token": token, "token_type": "bearer"}

# ---------------------------
# Dependency: Get current user
# ---------------------------
async def get_current_user(token: str = Depends(oauth2_scheme)):
    username = decode_access_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await users_collection.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ---------------------------
# Helper: AI / Graph Response
# ---------------------------
async def generate_ai_response(message: str) -> str:
    """
    Placeholder for AI/Graph integration.
    Replace with your actual LangGraph / OpenAI / custom logic.
    """
    # Example: synchronous call to LangGraph
    result = sync_graph.invoke({"messages": [{"role": "user", "content": message}]})
    
    # Normalize response into string
    if isinstance(result, dict) and "messages" in result:
        msgs = result["messages"]
        if msgs and isinstance(msgs, list):
            # Take last message content
            last = msgs[-1]
            if isinstance(last, dict):
                return last.get("content") or str(last)
            return str(last)
    return f"AI Response: {message}"  # fallback

# ---------------------------
# Chat Endpoint
# ---------------------------
@app.post("/chat")
async def chat(req: MessageRequest, user=Depends(get_current_user)):
    # Fetch last session for user
    session = await sessions_collection.find_one({"user_id": user["_id"]})
    messages = json.loads(session["messages"]) if session else []

    # Append user message
    messages.append({"role": "user", "content": req.message})

    # Generate actual AI response
    ai_content = await generate_ai_response(req.message)
    ai_response = {"role": "assistant", "content": ai_content}
    messages.append(ai_response)

    # Save session
    if not session:
        await sessions_collection.insert_one({"user_id": user["_id"], "messages": json.dumps(messages)})
    else:
        await sessions_collection.update_one({"_id": session["_id"]}, {"$set": {"messages": json.dumps(messages)}})

    return {"messages": messages}

# ---------------------------
# Run Graph Endpoint (/run)
# ---------------------------
@app.post("/run")
async def run_graph(payload: dict = Body(...)):
    """Invoke LangGraph with flexible payload."""
    try:
        # Accept either {"message": "..."} or {"messages": [...]}
        if "messages" in payload and isinstance(payload["messages"], list):
            messages_in = payload["messages"]
        elif "message" in payload:
            messages_in = [{"role": "user", "content": payload["message"]}]
        else:
            raise HTTPException(status_code=422, detail="Payload must include 'message' or 'messages'")

        result = sync_graph.invoke({"messages": messages_in})

        # Normalize messages into JSON-safe list
        messages = []
        raw_msgs = []
        if isinstance(result, dict):
            raw_msgs = result.get("messages") or []
        elif hasattr(result, "messages"):
            raw_msgs = getattr(result, "messages") or []

        for m in raw_msgs:
            if isinstance(m, dict):
                messages.append(m)
            else:
                content = getattr(m, "content", None) or getattr(m, "name", None) or str(m)
                messages.append({"content": content})

        return {"messages": messages}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

