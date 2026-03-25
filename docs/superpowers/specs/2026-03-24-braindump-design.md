# brAIndump — Design Specification

## Overview

brAIndump is a voice-first mobile app that helps users organize their thoughts with minimal effort. Users speak their thoughts into the app, which automatically transcribes, categorizes, and organizes them into actionable items across different life domains.

**Core thesis:** Humans think constantly but struggle to capture, organize, and act on those thoughts. brAIndump removes the friction by accepting raw voice dumps and doing the organizing work automatically.

**Target audience:** General consumer.
**Primary platform:** Mobile (iOS and Android).
**Team:** Solo developer.

---

## Core User Flow

1. **Capture** — User opens app, taps a mic button, speaks freely (e.g., "I need to buy milk and eggs, also remind me to follow up with Sarah about the proposal on Wednesday")
2. **Process** — Voice is transcribed on-device, then sent to an AI model to parse intent, extract actionable items, and categorize them
3. **Organize** — Extracted items land in auto-created categories (e.g., "Groceries" gets milk and eggs, "Work Follow-ups" gets the Sarah reminder with a Wednesday due date)
4. **Nudge (only when needed)** — If the AI can't confidently categorize something, a push notification asks a brief clarification next time the user opens the app

**Key principle:** A single voice dump can produce multiple items across multiple categories. The user doesn't need to make one recording per thought.

**Post-recording feedback:** A confirmation card shows what was extracted ("Added 2 items to Groceries, 1 reminder to Work Follow-ups") with the option to correct miscategorizations.

---

## Information Architecture

### Categories & Sub-categories

The app starts with seed categories covering common life domains:
- Groceries / Shopping
- Work Tasks
- Personal Tasks
- Health & Fitness
- Reminders
- Ideas / Notes

The AI maps incoming thoughts to existing categories. If a thought doesn't fit, the AI creates a new category automatically (e.g., "Home Renovation" emerges when the user starts mentioning renovation tasks).

**Sub-categories (one level deep):** The AI detects natural groupings within a category and creates sub-categories. Example:

```
Work Tasks
├── Project Alpha
│   ├── Follow up with Sarah on proposal
│   └── Review design specs
├── Team Management
│   ├── Schedule 1:1 with Jake
│   └── Write performance review
└── Admin
    └── Submit expense report
```

- Sub-categories are auto-created when the AI detects a pattern
- Items with no clear sub-grouping sit at the top level of the category
- Users can drag items between sub-categories or flatten them
- One level of nesting only in Phase 1 (data model supports deeper nesting later via parent_id)

Users can merge, rename, or delete categories and sub-categories manually.

### Item Structure

| Field | Example |
|-------|---------|
| Raw transcript | "I need to buy milk and eggs" |
| Parsed title | "Buy milk and eggs" |
| Category | Groceries |
| Sub-category | (optional) |
| Status | pending / done |
| Reminder (optional) | Wednesday 9am |
| Source voice note | audio file link |
| Confidence | high / low (triggers nudge if low) |
| Created at | timestamp |

### Category Views

- Each category is a simple list sorted by recency, done items pushed to bottom
- Items can be checked off with a tap
- Swipe to edit, delete, or recategorize

### Health & Fitness Tracking

- Food entries: daily log view (Breakfast: salad, Lunch: pizza)
- Exercise entries: activity + duration/distance
- Weekly summary card at the top of the Health category ("4 workouts this week, mostly home-cooked meals")

---

## Voice Processing Pipeline

```
Mic Input → Audio File (stored in Supabase Storage)
    → On-device speech-to-text (free)
    → Haiku 4.5 API (parsing + categorization, called from edge function)
    → Database writes (items created/updated)
    → UI update + confirmation card
```

### Transcription — On-device Speech Recognition

- **iOS:** `expo-speech-recognition` wrapping Apple's Speech framework — free, no API calls, works offline
- **Android:** Google's on-device speech recognizer — also free
- Trade-off: Slightly lower accuracy than cloud Whisper for messy/accented speech, but solid for English
- Fallback plan: Whisper API can be added as a premium option later

### Categorization — Haiku 4.5 (Anthropic API)

- One API call per voice note: extract items, categorize, detect sub-categories, set reminders, flag low-confidence items
- Prompt includes the user's current category/sub-category list as context so the model maps to existing buckets before creating new ones
- Structured JSON output for deterministic parsing
- Cost: Very cheap — likely under $5/month even with hundreds of daily users

### Performance Target

Under 5 seconds from end of recording to confirmation card.

### Edge Cases

- Very long voice notes (3+ min): processed normally, warning if results seem incomplete
- Ambiguous input: low-confidence items get a nudge flag
- Duplicate detection: AI checks against recent items to avoid duplicates

---

## Tech Stack & Architecture

### Frontend — React Native (Expo)

- Expo SDK for managed builds, OTA updates, push notifications
- `expo-speech-recognition` for on-device transcription
- `expo-av` for audio recording
- Expo Router for navigation
- Zustand for client state management

### Backend — Supabase

- **Auth:** Supabase Auth (email/password + Apple/Google sign-in)
- **Database:** PostgreSQL via Supabase
- **Storage:** Supabase Storage for original audio files
- **Edge Functions:** Supabase Edge Functions (Deno) for the AI processing pipeline
- **Realtime:** Supabase Realtime subscriptions to update UI when processing completes

### Database Schema

```
users

categories
  - user_id
  - name
  - parent_id (nullable, for sub-categories)

items
  - user_id
  - category_id
  - title
  - raw_transcript
  - status
  - reminder_at
  - confidence
  - created_at

voice_notes
  - user_id
  - item_ids[]
  - storage_path
  - duration
  - created_at

health_entries
  - user_id
  - type (food | exercise)
  - details (jsonb)
  - logged_at
```

### AI Layer

- On-device speech-to-text (free)
- Haiku 4.5 via Anthropic API (called from Supabase Edge Functions)

### Push Notifications

- Expo Push Notifications for reminders and low-confidence nudges

### Key Architectural Win

No separate backend server needed — Supabase handles auth, DB, storage, serverless functions, and realtime. Maximizes solo dev velocity.

---

## Phase 1 Scope

### Included

1. **Onboarding** — Sign up/login (email + Apple/Google sign-in), brief 2-screen tutorial
2. **Voice capture** — Tap mic, speak, stop. Audio saved locally + uploaded to Supabase Storage
3. **On-device transcription** — Speech-to-text runs immediately after recording
4. **AI categorization** — Transcript sent to Haiku 4.5 via edge function, returns structured items
5. **Confirmation card** — Shows extracted items, allows correction
6. **Auto-categorized feeds** — Home screen with category list, one level of sub-categories
7. **Item management** — Check off, edit, delete, recategorize
8. **Reminders** — Time references in voice notes trigger push notifications
9. **Health logging** — Food and exercise daily log with weekly summary card
10. **Low-confidence nudges** — Ambiguous items prompt quick clarification on next app open

### Excluded from Phase 1

- Shareable lists
- Agentic actions (purchasing, booking, sending emails)
- Deeper nesting beyond one sub-category level
- Web companion app
- Offline AI processing (offline recording is queued, categorization needs internet)
- Custom category icons/themes
- Data export
- Collaboration / multi-user

---

## Error Handling

### Voice & Transcription
- **Noisy environment:** Raw transcript shown on confirmation card for user to spot-check. Option to re-record.
- **Empty recording / silence:** Detect silence, discard, prompt "Didn't catch anything — try again?"
- **Very long notes (3+ min):** Process normally, warn if results seem incomplete. No hard cap.

### AI Categorization
- **API down or slow:** Queue transcript locally, retry with exponential backoff. User sees "Processing..." state but can view raw transcript.
- **Nonsensical input:** Create item in "Inbox" catch-all category with raw transcript for manual categorization.
- **Wrong categorization:** Confirmation card is first defense. Users can recategorize anytime.

### Data & Sync
- **No internet:** Audio recorded and stored locally. Transcription works on-device. Categorization queued until connectivity returns.
- **Supabase outage:** Local-first for capture. Items sync when connection restores.

### Reminders
- **Ambiguous time references ("soon", "later this week"):** Flag as low-confidence, ask user to set specific time.
- **Past dates ("yesterday"):** Log item without reminder, note the date context.

---

## Testing Strategy

### Unit Tests (Jest)
- AI prompt parsing: given mock Haiku response, verify items/categories are correctly created
- Reminder date extraction: "next Wednesday" resolves to correct date
- Confidence scoring logic: low-confidence items get flagged

### Integration Tests
- Voice capture → transcription → API call → DB write end-to-end flow with test Supabase project
- Push notification scheduling from reminder items

### Manual Testing Focus Areas
- Voice capture across devices and noise levels
- Varied speaking styles: fast, slow, stream-of-consciousness, multiple topics
- Category and sub-category inference with diverse inputs
- Offline → online sync behavior

### Deferred to Post-Phase 1
- E2E automated tests (Detox/Maestro)
- Load testing
- AI output regression suite
