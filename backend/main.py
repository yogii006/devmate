from fastapi import FastAPI, HTTPException, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from auth import hash_password, verify_password, create_access_token, decode_access_token
from bson import ObjectId
import json

# Centralized DB client
from db import users_collection, sessions_collection, conversations_collection
from src.graph import sync_graph  # your LangGraph instance
from datetime import datetime

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
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class MessageRequest(BaseModel):
    message: str

# ---------------------------
# Auth Endpoints
# ---------------------------
@app.post("/signup")
async def signup(user: UserCreate):
    # Check if username already exists
    existing_username = await users_collection.find_one({"username": user.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check if email already exists
    existing_email = await users_collection.find_one({"email": user.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    hashed_pwd = hash_password(user.password)
    result = await users_collection.insert_one({
        "username": user.username,
        "email": user.email,
        "password_hash": hashed_pwd
    })
    return {"msg": "User created successfully", "user_id": str(result.inserted_id)}

@app.post("/login")
async def login(user: UserLogin):
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token with email as subject
    token = create_access_token({"sub": db_user["email"]})
    
    # Return token along with username for display purposes
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": db_user["username"]
    }

# ---------------------------
# Dependency: Get current user
# ---------------------------
async def get_current_user(token: str = Depends(oauth2_scheme)):
    email = decode_access_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await users_collection.find_one({"email": email})
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
from fastapi import Request

@app.post("/run")
async def run_graph(request: Request, user=Depends(get_current_user), payload: dict = Body(...)):
    """Invoke LangGraph with flexible payload and pass username for file uploads."""
    try:
        # Get conversation_id from payload (if continuing existing conversation)
        conversation_id = payload.get("conversation_id")
        
        # Accept either {"message": "..."} or {"messages": [...]}
        if "messages" in payload and isinstance(payload["messages"], list):
            messages_in = payload["messages"]
        elif "message" in payload:
            messages_in = [{"role": "user", "content": payload["message"]}]
        else:
            raise HTTPException(status_code=422, detail="Payload must include 'message' or 'messages'")

        # Ensure all messages have role and content
        formatted_messages = []
        for msg in messages_in:
            if isinstance(msg, dict) and "role" in msg and "content" in msg:
                formatted_messages.append(msg)
            elif isinstance(msg, dict) and "content" in msg:
                # Add default role if missing
                formatted_messages.append({"role": "user", "content": msg["content"]})
            else:
                # Skip invalid messages
                continue

        if not formatted_messages:
            raise HTTPException(status_code=422, detail="No valid messages found")

        # Pass username to sync_graph for file upload context
        username = user["username"] if user and "username" in user else None
        
        # Use the invoke wrapper that handles message conversion
        result = sync_graph.invoke({"messages": formatted_messages, "username": username})

        # Normalize messages into JSON-safe list
        messages = []
        raw_msgs = []
        if isinstance(result, dict):
            raw_msgs = result.get("messages") or []
        elif hasattr(result, "messages"):
            raw_msgs = getattr(result, "messages") or []

        for m in raw_msgs:
            if isinstance(m, dict):
                # Ensure each message has role and content
                if "role" in m and "content" in m:
                    messages.append({"role": m["role"], "content": m["content"]})
                elif "content" in m:
                    messages.append({"role": "assistant", "content": m["content"]})
            else:
                # Handle non-dict messages
                content = getattr(m, "content", None) or str(m)
                role = getattr(m, "role", "assistant")
                messages.append({"role": role, "content": content})

        # Update or create conversation in MongoDB
        if conversation_id:
            # Update existing conversation
            await conversations_collection.update_one(
                {"_id": ObjectId(conversation_id), "user_id": user["_id"]},
                {
                    "$set": {
                        "messages": messages,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return {"messages": messages, "conversation_id": conversation_id}
        else:
            # Create new conversation
            result = await conversations_collection.insert_one({
                "user_id": user["_id"],
                "username": user["username"],
                "email": user["email"],
                "messages": messages,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            return {"messages": messages, "conversation_id": str(result.inserted_id)}
            
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error in /run endpoint: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------
# Get Conversations Endpoint
# ---------------------------
@app.get("/conversations")
async def get_conversations(user=Depends(get_current_user)):
    """Fetch all conversations for the current user."""
    try:
        conversations = await conversations_collection.find(
            {"user_id": user["_id"]}
        ).sort("updated_at", -1).to_list(length=None)
        
        # Convert ObjectId to string for JSON serialization
        for conv in conversations:
            conv["_id"] = str(conv["_id"])
            conv["user_id"] = str(conv["user_id"])
        
        return {"conversations": conversations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------
# Get Single Conversation Endpoint
# ---------------------------
@app.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, user=Depends(get_current_user)):
    """Fetch a specific conversation by ID."""
    try:
        conversation = await conversations_collection.find_one({
            "_id": ObjectId(conversation_id),
            "user_id": user["_id"]
        })
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        conversation["_id"] = str(conversation["_id"])
        conversation["user_id"] = str(conversation["user_id"])
        
        return {"conversation": conversation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))