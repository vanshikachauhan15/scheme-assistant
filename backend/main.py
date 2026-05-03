from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from .chatbot import get_chatbot_response
from .translate import parse_and_translate_response
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


class TranslateRequest(BaseModel):
    text: str
    target_language: str = "hi"


@app.post("/chatbot")
def chatbot_endpoint(payload: ChatRequest) -> dict[str, str]:
    response = get_chatbot_response(payload.query, conversation_id=payload.conversation_id)
    return {"response": response}


@app.post("/translate")
def translate_endpoint(payload: TranslateRequest) -> dict[str, str]:
    import sys
    try:
        print(f"Translation request received. Text length: {len(payload.text)}", file=sys.stderr)
        translated = parse_and_translate_response(payload.text, payload.target_language)
        print(f"Translation successful. Result length: {len(translated)}", file=sys.stderr)
        return {"translated": translated}
    except Exception as exc:
        error_detail = f"Translation error: {str(exc)}"
        print(f"ERROR: {error_detail}", file=sys.stderr)
        raise HTTPException(status_code=500, detail=error_detail) from exc


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
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=f"Missing dependency: {str(exc)}") from exc
    except Exception as exc:
        import sys
        exc_info = f"{type(exc).__name__}: {str(exc)}"
        print(f"Speech-to-text error: {exc_info}", file=sys.stderr)
        raise HTTPException(status_code=500, detail=exc_info) from exc
