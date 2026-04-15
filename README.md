# brAIndump

A voice-first mobile app that captures spoken thoughts, auto-categorizes them via AI, and organizes them into actionable feeds.

Speak freely into the app — it transcribes your voice, extracts actionable items, and sorts them into categories like Groceries, Work Tasks, Health & Fitness, and more. A single voice dump can produce multiple items across multiple categories.

## Features

- **Voice capture** — Tap, speak, done. On-device speech-to-text with text input fallback
- **AI categorization** — Gemini 2.5 Flash extracts items, assigns categories, and detects sub-categories
- **Auto-organized feeds** — Items land in the right category automatically. New categories are created on the fly
- **Health tracking** — Food and exercise entries are logged with daily view and weekly summary
- **Reminders** — Time references in voice notes trigger push notifications
- **Low-confidence nudges** — Ambiguous items prompt quick clarification
- **Offline support** — Voice notes are queued offline and processed when connectivity returns
- **Realtime sync** — UI updates live via Supabase Realtime

## Tech Stack

- **Frontend:** React Native (Expo SDK 55), TypeScript, Expo Router, Zustand
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions, Realtime)
- **AI:** Gemini 2.5 Flash via Supabase Edge Function
- **Speech:** On-device speech recognition (`expo-speech-recognition`)

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Supabase CLI (`brew install supabase/tap/supabase`)
- A [Supabase](https://supabase.com) project
- A [Gemini API key](https://aistudio.google.com/apikey)

### Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/sunandashanbhag/brAIndump.git
   cd brAIndump
   npm install --legacy-peer-deps
   ```

2. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your Supabase URL, anon key, and Gemini API key.

3. **Set up Supabase**
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   supabase secrets set GEMINI_API_KEY=your-key
   supabase functions deploy categorize --no-verify-jwt
   ```
   Then in the Supabase dashboard:
   - Create a private storage bucket called `voice-notes`
   - Enable Realtime on the `items` and `categories` tables
   - Under Authentication > Providers > Email, disable "Confirm email" for development

4. **Run the app**
   ```bash
   npx expo start --ios
   ```

## Project Structure

```
app/                    # Expo Router screens
  (auth)/               # Login & signup
  (tabs)/               # Home, Record, Settings tabs
  category/[id].tsx     # Category detail view
  item/[id].tsx         # Item detail/edit
  health/               # Health dashboard
  onboarding.tsx        # Tutorial screens
src/
  components/           # UI components
  lib/                  # Supabase client, AI parsing, recorder, transcriber
  stores/               # Zustand state (auth, categories, recording, health)
  types/                # TypeScript types
  constants/            # Seed categories
supabase/
  migrations/           # Database schema
  functions/categorize/ # Edge function for AI categorization
```

## License

MIT
