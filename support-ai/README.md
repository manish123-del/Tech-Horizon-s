# Support AI Assistant

This repository contains a production-ready AI voice assistant and customer support chatbot built with **Next.js 14 (App Router)** and **TypeScript**. The backend relies on **Supabase** for authentication, database, and realtime capabilities; OpenAI APIs power the natural language and speech features. Tailwind CSS and shadcn/ui provide the responsive UI.

## 🧱 Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Auth/DB**: Supabase (auth, PostgreSQL, realtime)
- **AI**: OpenAI GPT-4o (chat), Whisper (speech-to-text), TTS
- **Integrations**: WhatsApp via Twilio, embeddable web widget
- **Multilingual**: English, Hindi, Tamil, Telugu, Marathi, Bengali detection

## 🚀 Features

1. **AI Voice Interaction** – record audio, transcribe via Whisper, chat with GPT-4o, play responses with TTS, and visualize waveform.
2. **Multilingual Support** – auto-detect and respond in the same language spoken.
3. **Sentiment & Urgency Analysis** – classify messages, flag critical urgency, log to Supabase.
4. **Full Chat UI** – text & voice inputs, conversation history stored in Supabase.
5. **Admin Dashboard** – view/filter/export conversations, see analytics.
6. **Embeddable Widget** – minimal script for floating chat button on any site.
7. **WhatsApp Integration** – AI replies to incoming WhatsApp messages.
8. **Security** – environment variables, Supabase RLS policies, rate limiting.

## 📁 Project Structure

```
src/
  app/               # Next.js pages & API routes
  components/        # Reusable UI components (ui badge, button, card)
  hooks/             # Custom React hooks (useRecorder, useUser)
  lib/               # Supabase client, OpenAI utils, rate limiter, helpers
  types/             # TypeScript interfaces for tables
  public/            # Static assets & embed script
supabase/            # Database migrations
.env.example         # Example environment variables
README.md            # This file
```

## ⚙️ Setup Instructions

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd support-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or pnpm install, yarn install
   ```

3. **Configure environment**
   - Copy `.env.example` to `.env.local` and fill in the variables. Keys required:
     - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `OPENAI_API_KEY`
     - (Optional) Twilio credentials for WhatsApp integration
   ```bash
   cp .env.example .env.local
   ```

4. **Set up Supabase**
   - Create a new Supabase project and obtain your URL & keys.
   - Use the SQL migration under `supabase/migrations/001_init.sql` to create tables and policies:
     ```bash
     supabase db reset --file=supabase/migrations/001_init.sql
     ```
   - Enable RLS (policies are defined in the migration).

5. **Run locally**
   ```bash
   npm run dev
   # Opens at http://localhost:3000
   ```

6. **Testing the widget**
   - Drop `public/embed.js` into any website and configure via `window.SupportAI`:
     ```html
     <script>
       window.SupportAI = { url: 'https://your-app.vercel.app/chat', inline: true, color: '#4f46e5' };
     </script>
     <script src="https://your-app.vercel.app/embed.js"></script>
     ```

## 🛡️ Security Notes

- API keys never exposed to client; server routes use service role when writing to Supabase.
- RLS policies restrict data access to owners and admins.
- Rate limiting middleware prevents abuse of endpoints.
- Simple input sanitization via server logic.

## 📦 Deployment

1. **Vercel** is recommended; connect the repository and set environment variables in the dashboard.
2. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set as a protected environment variable.
3. Build command: `npm run build`, output directory is automatically detected.

For manual deployment:
```bash
npm run build
target=serverless next start
```

## 📚 Additional Notes

- Conversations are stored to Supabase under `conversations` and `messages` tables.
- Flagged events are created automatically for critical urgency or fraud patterns.
- The dashboard export option retrieves CSVs via `/api/export`.
- WhatsApp integration uses Twilio webhook at `/api/whatsapp`.

## ✅ Ready for Production

All core features requested are implemented, and the codebase is modular and typed. Feel free to extend with more advanced analytics, multi-tenant business configurations, CRM webhooks, or additional language voices.

---

Thank you for building with this stack!
