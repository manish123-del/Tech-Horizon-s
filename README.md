# Tech Horizon's — AI Voice Assistant

This repository contains a real-time multilingual AI voice assistant demo (Hindi + English) with empathetic, urgency-aware responses, voice input/output, smart business flows, and analytics.

## Stack

- Frontend: React (Vite), Web Speech API (SpeechRecognition, SpeechSynthesis), modern CSS
- Backend: Node.js (Express), OpenAI API (optional), mock business logic, in-memory analytics, optional n8n webhook escalation

## How To Run

1. Backend
   - Copy `backend/.env.example` to `backend/.env` and set `OPENAI_API_KEY` (optional) and `N8N_WEBHOOK_URL` (optional)
   - Install and start:
     - `cd backend`
     - `npm install`
     - `npm start`
   - Health check: open `http://localhost:5000/health`

2. Frontend
   - Copy `frontend/.env.example` to `frontend/.env` (defaults work for local)
   - Install and start:
     - `cd frontend`
     - `npm install --include=dev`
     - `npm run dev` (serves at `http://localhost:5174/`)
   - Build preview:
     - `npm run build`
     - `npm run preview`

## Files Overview (What each file does)

Top-level
- `README.md` — Project overview, usage instructions

Backend
- `backend/package.json` — Scripts and dependencies for the server
- `backend/.env.example` — Example env vars (`OPENAI_API_KEY`, `PORT`, `N8N_WEBHOOK_URL`)
- `backend/src/server.js` — Express server:
  - `GET /health` — returns `{ ok: true }`
  - `POST /chat` — accepts `{ text, lang }`, returns JSON reply with `reply`, `detectedEmotion`, `urgencyLevel`, `intent`
  - `GET /stats` — in-memory counters (conversations, urgent cases, angry customers)
  - If `OPENAI_API_KEY` is set: uses `gpt-4o-mini` with `response_format: json_object` for structured AI output
  - Mock business flows: order tracking, payment issue, complaint, refund
  - High urgency escalation: POST to `N8N_WEBHOOK_URL` (optional)

Frontend
- `frontend/package.json` — Scripts and dependencies for the web app
- `frontend/vite.config.js` — Dev server config (port 5174)
- `frontend/index.html` — App HTML entry
- `frontend/.env.example` — Example env (`VITE_BACKEND_URL`)
- `frontend/src/styles.css` — Styled layout, chat bubbles, badges, stable controls row
- `frontend/src/main.jsx` — React root render
- `frontend/src/App.jsx` — Switches between VoiceChat and Analytics
- `frontend/src/components/VoiceChat.jsx` — Main voice UI:
  - Start/Stop listening control, End Call, language select
  - Recognition via Web Speech API; shows interim and final text
  - Clear mic error messages; preflight mic permission
  - Stable timer (freezes on stop), fixed layout (no jiggling)
  - Sends text to backend; speaks AI response with tone adjustment
- `frontend/src/components/ChatBubble.jsx` — Chat message bubble with emotion/urgency badges
- `frontend/src/components/Analytics.jsx` — Dashboard consuming `/stats`

## Notes

- Use Chrome desktop for SpeechRecognition and SpeechSynthesis support.
- If microphone permission is denied, allow it in browser settings for `localhost`.
- For production, persist analytics to a database and secure CORS/auth.

## License

MIT
