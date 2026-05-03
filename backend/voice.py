from __future__ import annotations

import json
import subprocess
import wave
from pathlib import Path
from uuid import uuid4

import pyttsx3
from vosk import KaldiRecognizer, Model

ROOT = Path(__file__).resolve().parents[1]
VOSK_MODEL_PATH = ROOT / "backend" / "models" / "vosk-model-small-hi-0.22"
AUDIO_DIR = ROOT / "backend" / ".audio"


def _to_wav(input_path: Path) -> Path:
    if input_path.suffix.lower() == ".wav":
        return input_path
    out = AUDIO_DIR / f"{uuid4().hex}.wav"
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(input_path),
        "-ac",
        "1",
        "-ar",
        "16000",
        str(out),
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    return out


def speech_to_text(audio_file: str | Path) -> str:
    src = Path(audio_file)
    if not VOSK_MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Vosk Hindi model not found at: {VOSK_MODEL_PATH}\n"
            f"Please download the model from https://alphacephei.com/vosk/models"
        )
    try:
        wav_path = _to_wav(src)
    except FileNotFoundError as e:
        raise RuntimeError(f"FFmpeg not installed or audio conversion failed: {e}") from e
    except Exception as e:
        raise RuntimeError(f"Failed to convert audio to WAV: {e}") from e
    
    try:
        model = Model(str(VOSK_MODEL_PATH))
    except Exception as e:
        raise RuntimeError(f"Failed to load Vosk model: {e}") from e
    
    result_text = ""
    try:
        with wave.open(str(wav_path), "rb") as wf:
            rec = KaldiRecognizer(model, wf.getframerate())
            while True:
                data = wf.readframes(4000)
                if not data:
                    break
                if rec.AcceptWaveform(data):
                    part = json.loads(rec.Result()).get("text", "").strip()
                    if part:
                        result_text = f"{result_text} {part}".strip()
            final = json.loads(rec.FinalResult()).get("text", "").strip()
            if final:
                result_text = f"{result_text} {final}".strip()
    except Exception as e:
        raise RuntimeError(f"Speech recognition failed: {e}") from e
    
    return result_text


def text_to_speech(text: str) -> Path:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    out = AUDIO_DIR / f"{uuid4().hex}.wav"
    engine = pyttsx3.init()
    engine.setProperty("rate", 160)
    engine.save_to_file(text, str(out))
    engine.runAndWait()
    return out
