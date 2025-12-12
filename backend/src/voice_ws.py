# voice_ws.py — FINAL UPDATED VERSION WITH WORKING TTS

import json
import base64
import io
from fastapi import WebSocket, APIRouter
from fastapi.websockets import WebSocketDisconnect
from src.auth import decode_access_token
from src.graph import sync_graph

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

            # ------------------------------------------
            # END EVENT ("mouseup" or "touchend")
            # ------------------------------------------
            if msg["type"] == "websocket.receive" and "text" in msg:
                try:
                    data = json.loads(msg["text"])

                    if data.get("event") == "end":
                        print("⏹ Received end signal")

                        if not audio_chunks:
                            await websocket.send_json({"error": "No audio received"})
                            continue

                        # Combine all binary audio chunks
                        raw_bytes = b"".join(audio_chunks)
                        audio_chunks = []

                        # ------------------------------------------------------
                        # STEP 1 — TRANSCRIBE WEBM AUDIO (forcing English)
                        # ------------------------------------------------------
                        try:
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
                        except Exception as e:
                            import traceback
                            tb = traceback.format_exc()
                            print("Transcription error:", e)
                            print(tb)
                            await websocket.send_json({"type": "error", "message": f"transcription failed: {str(e)}"})
                            # reset audio buffer and continue
                            audio_chunks = []
                            continue

                        # ------------------------------------------------------
                        # STEP 2 — SEND TRANSCRIPT TO LANGGRAPH AGENT
                        # ------------------------------------------------------
                        result = await sync_graph.invoke({
                            "messages": [{"role": "user", "content": transcript}],
                            "user_id": user["email"]
                        })

                        ai_reply = result["messages"][-1]["content"]

                        await websocket.send_json({
                            "type": "assistant_text",
                            "text": ai_reply
                        })

                        # ------------------------------------------------------
                        # STEP 3 — CONVERT AI REPLY → SPEECH (TTS PATCH APPLIED)
                        # ------------------------------------------------------
                        try:
                            speech_response = client.audio.speech.create(
                                model="gpt-4o-mini-tts",
                                voice="alloy",
                                input=ai_reply
                            )

                            # MUST call .read() because API returns streaming-like bytes
                            raw_audio = speech_response.read()

                            audio_base64 = base64.b64encode(raw_audio).decode()

                            await websocket.send_json({
                                "type": "assistant_audio",
                                "audio": audio_base64
                            })
                        except Exception as e:
                            import traceback
                            tb = traceback.format_exc()
                            print("TTS error:", e)
                            print(tb)
                            await websocket.send_json({"type": "error", "message": f"tts failed: {str(e)}"})
                            continue

                        continue

                except json.JSONDecodeError:
                    pass  # ignore non-JSON text messages

            # ------------------------------------------------------
            # BINARY AUDIO CHUNKS FROM MediaRecorder
            # ------------------------------------------------------
            if msg["type"] == "websocket.receive" and "bytes" in msg:
                audio_chunks.append(msg["bytes"])

    except WebSocketDisconnect:
        print("❌ WebSocket disconnected")

    except Exception as e:
        print("WS ERROR:", e)
        await websocket.close()
