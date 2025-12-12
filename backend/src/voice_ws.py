# voice_ws.py (FINAL VERSION — FIXED)

import json
import base64
import io
from fastapi import WebSocket, APIRouter
from fastapi.websockets import WebSocketDisconnect
from src.auth import decode_access_token
from src.graph import sync_graph

import soundfile as sf
import numpy as np

from openai import OpenAI
client = OpenAI()

router = APIRouter()


# ---------------------------
# AUTH FOR WEBSOCKET
# ---------------------------
async def get_user_from_ws(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return None

    email = decode_access_token(token)
    if not email:
        await websocket.close(code=4002)
        return None

    return {"email": email}


# ---------------------------
# REALTIME VOICE WEBSOCKET
# ---------------------------
@router.websocket("/voice/ws")
async def voice_chat(websocket: WebSocket):
    await websocket.accept()

    user = await get_user_from_ws(websocket)
    if not user:
        return

    print("🎤 User connected to voice WebSocket")

    audio_chunks = []

    try:
        while True:
            msg = await websocket.receive()

            # ------------------------------------
            # CHECK FOR END EVENT (text-based)
            # ------------------------------------
            if msg["type"] == "websocket.receive" and "text" in msg:
                try:
                    data = json.loads(msg["text"])
                    if data.get("event") == "end":
                        print("⏹ Received end signal")

                        if not audio_chunks:
                            await websocket.send_json({"error": "No audio received"})
                            continue

                        # ------------------------------------
                        # CONCAT AUDIO
                        # ------------------------------------
                        raw_bytes = b"".join(audio_chunks)
                        audio_chunks = []

                        # Convert WebM/Opus → WAV PCM
                        # Whisper can read WebM directly
                        whisper = client.audio.transcriptions.create(
                            model="gpt-4o-transcribe",
                            file=("audio.webm", raw_bytes, "audio/webm"),
                            language="en"  
                        )
                        transcript = whisper.text


                        await websocket.send_json({
                            "type": "transcript",
                            "text": transcript
                        })

                        # ------------------------------------
                        # SEND TO LANGGRAPH
                        # ------------------------------------
                        result = await sync_graph.invoke({
                            "messages": [{"role": "user", "content": transcript}],
                            "user_id": user["email"]
                        })

                        ai_reply = result["messages"][-1]["content"]

                        await websocket.send_json({
                            "type": "assistant_text",
                            "text": ai_reply
                        })

                        # ------------------------------------
                        # ASSISTANT TEXT → SPEECH
                        # ------------------------------------
                        
                        speech_response = client.audio.speech.create(
                            model="gpt-4o-mini-tts",
                            voice="alloy",
                            input=ai_reply
                        )

                        # Extract raw bytes
                        speech_bytes = speech_response.read()

                        await websocket.send_json({
                            "type": "assistant_audio",
                            "audio": base64.b64encode(speech_bytes).decode()
})


                        continue

                except json.JSONDecodeError:
                    pass  # Ignore malformed text messages

            # ------------------------------------
            # BINARY AUDIO CHUNK
            # ------------------------------------
            if msg["type"] == "websocket.receive" and "bytes" in msg:
                audio_chunks.append(msg["bytes"])

    except WebSocketDisconnect:
        print("❌ WebSocket disconnected")

    except Exception as e:
        print("WS ERROR:", e)
        await websocket.close()
