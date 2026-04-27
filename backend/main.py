from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from .chatbot import get_chatbot_response
from .voice import speech_to_text, text_to_speech

ROOT = Path(__file__).resolve().parents[1]
UPLOAD_DIR = ROOT / "backend" / ".uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Scheme Assistant Chatbot API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    query: str
    conversation_id: str = "default"


@app.post("/chatbot")
def chatbot_endpoint(payload: ChatRequest) -> dict[str, str]:
    response = get_chatbot_response(payload.query, conversation_id=payload.conversation_id)
    return {"response": response}


@app.post("/voice-chatbot")
async def voice_chatbot_endpoint(
    audio: UploadFile = File(...),
    conversation_id: str = Form("default"),
) -> FileResponse:
    if not audio.filename:
        raise HTTPException(status_code=400, detail="Audio file is required")
    temp_path = UPLOAD_DIR / f"{uuid4().hex}-{audio.filename}"
    with temp_path.open("wb") as f:
        while True:
            chunk = await audio.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)
    try:
        query_text = speech_to_text(temp_path)
        if not query_text:
            query_text = "माफ कीजिए, आपकी आवाज़ समझ नहीं आई"
        answer = get_chatbot_response(query_text, conversation_id=conversation_id)
        audio_out = text_to_speech(answer)
        return FileResponse(str(audio_out), media_type="audio/wav", filename="chatbot-response.wav")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/speech-to-text")
async def speech_to_text_endpoint(audio: UploadFile = File(...)) -> dict[str, str]:
    if not audio.filename:
        raise HTTPException(status_code=400, detail="Audio file is required")
    temp_path = UPLOAD_DIR / f"{uuid4().hex}-{audio.filename}"
    with temp_path.open("wb") as f:
        while True:
            chunk = await audio.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)
    try:
        text = speech_to_text(temp_path)
        return {"text": text.strip()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
