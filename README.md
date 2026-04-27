# Scheme Assistant

This project now includes:
- Existing React frontend with scheme search/filtering
- New offline Python chatbot backend with:
  - Query classification (`DISCOVERY` / `INFORMATION`)
  - RAG over local scheme CSV
  - Local Ollama response generation in Hindi
  - Offline voice input/output (Vosk + pyttsx3)

## Backend Setup (Offline)

1) Install Python dependencies:

```bash
cd backend
pip install -r requirements.txt
```

2) Download and place Vosk Hindi model:
- Download: `vosk-model-small-hi-0.22`
- Extract to: `backend/models/vosk-model-small-hi-0.22`

3) Install and start Ollama:

```bash
ollama pull llama3.1:8b-instruct
ollama run llama3.1:8b-instruct
```

Keep Ollama running on default local endpoint `http://127.0.0.1:11434`.

4) Run backend API:

```bash
cd backend
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

## Frontend Setup

From project root:

```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

Optional `.env` value for frontend:

```env
VITE_BACKEND_URL=http://127.0.0.1:8000
```

## New Chatbot APIs

- `POST /chatbot`
  - Body: `{ "query": "text", "conversation_id": "optional-id" }`
  - Returns: `{ "response": "Hindi text" }`

- `POST /voice-chatbot`
  - FormData: `audio` (file), `conversation_id` (optional)
  - Returns: `audio/wav` response file

## New Backend Modules

- `backend/chatbot.py` - classification, Hinglish normalization, memory, response orchestration
- `backend/embeddings.py` - sentence-transformers embeddings + FAISS index
- `backend/rag.py` - top-k scheme retrieval + context building
- `backend/voice.py` - Vosk STT + pyttsx3 TTS
- `backend/main.py` - FastAPI endpoints
