# Scheme Assistant

Features

- React frontend for scheme search, filtering, and browsing
- FastAPI backend with a scheme-aware chatbot and RAG retrieval from `cleaned_schemes.csv`
- FAISS-based semantic search over scheme metadata
- Local Ollama integration for Hindi chatbot responses
- Hindi speech input via Vosk and Hindi audio output via pyttsx3
- Translation utilities for converting chatbot output into Hindi-friendly labels

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
ollama pull phi3
ollama run phi3
```

Keep Ollama running on default local endpoint `http://127.0.0.1:11434`.

4) Run backend API:

```bash
cd backend
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend Setup

From project root:

```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:5175` and is also reachable from other devices on the same local network at `http://<PC_IP>:5175`.

If the site still shows `ERR_CONNECTION_REFUSED` on your phone:

- Make sure the dev server is running and the terminal shows a Vite URL.
- Confirm your PC local IP with `ipconfig` and use that IP in the browser.
- Allow port `5175` through Windows Firewall if needed.
- Use `http://<PC_IP>:5175`, not `localhost`, on the mobile device.

If you want the frontend to talk to the backend over the network, create a file named `.env` in the project root (same folder as `package.json`) and add your laptop IP like this:

```env
VITE_BACKEND_URL=http://<PC_IP>:8000
```

Use the actual IP that appears in `ipconfig` for your WiFi adapter. Do not include the angle brackets `< >`.

Then restart the frontend server:

```bash
npm run dev
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
http://172.25.89.6:8000/docs
