# brAIndump Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a voice-first mobile app that captures spoken thoughts, auto-categorizes them via AI, and organizes them into actionable feeds.

**Architecture:** React Native (Expo) frontend with Supabase backend (auth, PostgreSQL, storage, edge functions, realtime). On-device speech-to-text for transcription, Haiku 4.5 via Supabase Edge Function for AI categorization. Zustand for client state. Expo Router for navigation.

**Tech Stack:** React Native, Expo SDK 52+, TypeScript, Supabase (PostgreSQL, Auth, Storage, Edge Functions, Realtime), Zustand, expo-av, expo-speech-recognition, Anthropic API (Haiku 4.5), expo-notifications, Jest

---

## File Structure

```
braindump/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout (auth gate, providers)
│   ├── (auth)/
│   │   ├── _layout.tsx           # Auth layout
│   │   ├── login.tsx             # Login screen
│   │   └── signup.tsx            # Signup screen
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigation layout
│   │   ├── index.tsx             # Home screen (category feeds)
│   │   ├── record.tsx            # Voice recording screen
│   │   └── settings.tsx          # Settings screen
│   ├── category/
│   │   └── [id].tsx              # Category detail (items list)
│   ├── item/
│   │   └── [id].tsx              # Item detail/edit screen
│   ├── health/
│   │   └── index.tsx             # Health & fitness dashboard
│   └── onboarding.tsx            # Tutorial screens
├── src/
│   ├── components/
│   │   ├── CategoryCard.tsx      # Category card for home feed
│   │   ├── ItemRow.tsx           # Single item row with swipe actions
│   │   ├── ConfirmationCard.tsx  # Post-recording extraction summary
│   │   ├── NudgePrompt.tsx       # Low-confidence clarification prompt
│   │   ├── RecordButton.tsx      # Mic button component
│   │   ├── HealthDailyLog.tsx    # Daily food/exercise log
│   │   └── WeeklySummaryCard.tsx # Weekly health summary
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client init
│   │   ├── ai.ts                 # AI response parsing & types
│   │   ├── recorder.ts           # Audio recording wrapper
│   │   ├── transcriber.ts        # Speech-to-text wrapper
│   │   ├── notifications.ts     # Push notification helpers
│   │   └── dateParser.ts         # Reminder date extraction
│   ├── stores/
│   │   ├── authStore.ts          # Auth state (Zustand)
│   │   ├── categoryStore.ts      # Categories & items state
│   │   ├── recordingStore.ts     # Recording & processing state
│   │   └── healthStore.ts        # Health entries state
│   ├── types/
│   │   └── index.ts              # Shared TypeScript types
│   └── constants/
│       └── seedCategories.ts     # Default category definitions
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql # Database schema
│   └── functions/
│       └── categorize/
│           └── index.ts          # Edge function: transcript → Haiku → items
├── __tests__/
│   ├── lib/
│   │   ├── ai.test.ts            # AI response parsing tests
│   │   └── dateParser.test.ts    # Date extraction tests
│   ├── stores/
│   │   ├── categoryStore.test.ts # Category store tests
│   │   └── healthStore.test.ts   # Health store tests
│   └── components/
│       ├── ConfirmationCard.test.tsx
│       └── ItemRow.test.tsx
├── app.json                      # Expo config
├── package.json
├── tsconfig.json
└── .env.local                    # Supabase URL, anon key, Anthropic key (gitignored)
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `app.json`, `package.json`, `tsconfig.json`, `.gitignore`, `.env.local.example`

- [ ] **Step 1: Initialize Expo project**

```bash
npx create-expo-app@latest braindump --template blank-typescript
cd braindump
```

- [ ] **Step 2: Install core dependencies**

```bash
npx expo install expo-router expo-av expo-speech-recognition expo-notifications expo-secure-store expo-splash-screen react-native-gesture-handler react-native-reanimated react-native-safe-area-context react-native-screens
npm install @supabase/supabase-js zustand @anthropic-ai/sdk
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native @types/jest
```

- [ ] **Step 3: Configure Expo Router in app.json**

Update `app.json` to use Expo Router:

```json
{
  "expo": {
    "name": "brAIndump",
    "slug": "braindump",
    "scheme": "braindump",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "plugins": [
      "expo-router",
      [
        "expo-speech-recognition",
        {
          "microphonePermission": "brAIndump needs your microphone to capture voice notes.",
          "speechRecognitionPermission": "brAIndump needs speech recognition to transcribe your voice notes."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png"
        }
      ]
    ],
    "web": {
      "bundler": "metro"
    }
  }
}
```

- [ ] **Step 4: Create .env.local.example and .gitignore**

`.env.local.example`:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=your-anthropic-key
```

Add to `.gitignore`:
```
.env.local
```

- [ ] **Step 5: Create root layout with placeholder**

Create `app/_layout.tsx`:
```tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
```

- [ ] **Step 6: Verify app builds and runs**

```bash
npx expo start
```

Expected: App starts with no errors, shows blank screen.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Expo project with dependencies"
```

---

## Task 2: TypeScript Types & Constants

**Files:**
- Create: `src/types/index.ts`, `src/constants/seedCategories.ts`

- [ ] **Step 1: Define shared types**

Create `src/types/index.ts`:
```ts
export type ItemStatus = "pending" | "processing" | "done";
export type ConfidenceLevel = "high" | "low";
export type HealthEntryType = "food" | "exercise";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

export interface Item {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  raw_transcript: string;
  status: ItemStatus;
  reminder_at: string | null;
  confidence: ConfidenceLevel;
  created_at: string;
}

export interface VoiceNote {
  id: string;
  user_id: string;
  storage_path: string;
  duration: number;
  created_at: string;
}

export interface VoiceNoteItem {
  voice_note_id: string;
  item_id: string;
}

export interface HealthEntry {
  id: string;
  user_id: string;
  type: HealthEntryType;
  details: FoodDetails | ExerciseDetails;
  logged_at: string;
}

export interface FoodDetails {
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  description: string;
}

export interface ExerciseDetails {
  activity: string;
  duration_minutes: number | null;
  distance_km: number | null;
}

export interface AICategorizationResult {
  items: AIExtractedItem[];
  health_entries: AIExtractedHealthEntry[];
}

export interface AIExtractedItem {
  title: string;
  category_name: string;
  sub_category_name: string | null;
  reminder_at: string | null;
  confidence: ConfidenceLevel;
}

export interface AIExtractedHealthEntry {
  type: HealthEntryType;
  details: FoodDetails | ExerciseDetails;
}
```

- [ ] **Step 2: Define seed categories**

Create `src/constants/seedCategories.ts`:
```ts
export const SEED_CATEGORIES = [
  "Groceries / Shopping",
  "Work Tasks",
  "Personal Tasks",
  "Health & Fitness",
  "Reminders",
  "Ideas / Notes",
  "Inbox",
] as const;
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts src/constants/seedCategories.ts
git commit -m "feat: add TypeScript types and seed categories"
```

---

## Task 3: Supabase Client & Database Schema

**Files:**
- Create: `src/lib/supabase.ts`, `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create Supabase project**

Go to https://supabase.com/dashboard, create a new project called "braindump". Note the project URL and anon key. Add them to `.env.local`.

- [ ] **Step 2: Write the database migration**

Create `supabase/migrations/001_initial_schema.sql`:
```sql
-- Categories (with sub-category support via parent_id)
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  parent_id uuid references categories(id) on delete cascade,
  created_at timestamptz default now() not null
);

create index idx_categories_user on categories(user_id);
create index idx_categories_parent on categories(parent_id);

-- Items
create table items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  title text not null,
  raw_transcript text not null default '',
  status text not null default 'pending' check (status in ('pending', 'processing', 'done')),
  reminder_at timestamptz,
  confidence text not null default 'high' check (confidence in ('high', 'low')),
  created_at timestamptz default now() not null
);

create index idx_items_user on items(user_id);
create index idx_items_category on items(category_id);
create index idx_items_status on items(status);

-- Voice notes
create table voice_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  storage_path text not null,
  duration real not null default 0,
  created_at timestamptz default now() not null
);

-- Join table: voice_notes <-> items (many-to-many)
create table voice_note_items (
  voice_note_id uuid references voice_notes(id) on delete cascade not null,
  item_id uuid references items(id) on delete cascade not null,
  primary key (voice_note_id, item_id)
);

-- Health entries
create table health_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('food', 'exercise')),
  details jsonb not null default '{}',
  logged_at timestamptz default now() not null
);

create index idx_health_user on health_entries(user_id);
create index idx_health_type on health_entries(type);

-- Row Level Security
alter table categories enable row level security;
alter table items enable row level security;
alter table voice_notes enable row level security;
alter table voice_note_items enable row level security;
alter table health_entries enable row level security;

-- RLS policies: users can only access their own data
create policy "Users can CRUD own categories"
  on categories for all using (auth.uid() = user_id);

create policy "Users can CRUD own items"
  on items for all using (auth.uid() = user_id);

create policy "Users can CRUD own voice notes"
  on voice_notes for all using (auth.uid() = user_id);

create policy "Users can CRUD own voice note items"
  on voice_note_items for all using (
    voice_note_id in (select id from voice_notes where user_id = auth.uid())
  );

create policy "Users can CRUD own health entries"
  on health_entries for all using (auth.uid() = user_id);
```

- [ ] **Step 3: Apply migration via Supabase dashboard**

Go to Supabase Dashboard → SQL Editor → paste and run the migration SQL.

- [ ] **Step 4: Create Supabase client**

Create `src/lib/supabase.ts`:
```ts
import "react-native-url-polyfill/dist/polyfill";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [ ] **Step 5: Install URL polyfill**

```bash
npm install react-native-url-polyfill
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase.ts supabase/migrations/001_initial_schema.sql
git commit -m "feat: add Supabase client and database schema"
```

---

## Task 4: Auth Store & Auth Screens

**Files:**
- Create: `src/stores/authStore.ts`, `app/(auth)/_layout.tsx`, `app/(auth)/login.tsx`, `app/(auth)/signup.tsx`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Create auth store**

Create `src/stores/authStore.ts`:
```ts
import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  loading: boolean;
  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  loading: true,

  initialize: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({ session, loading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
    });
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
}));
```

- [ ] **Step 2: Create auth layout**

Create `app/(auth)/_layout.tsx`:
```tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
```

- [ ] **Step 3: Create login screen**

Create `app/(auth)/login.tsx`:
```tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link } from "expo-router";
import { useAuthStore } from "../../src/stores/authStore";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const signIn = useAuthStore((s) => s.signIn);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert("Login failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Text style={styles.title}>brAIndump</Text>
      <Text style={styles.subtitle}>Organize your thoughts effortlessly</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Logging in..." : "Log In"}
        </Text>
      </TouchableOpacity>

      <Link href="/(auth)/signup" style={styles.link}>
        <Text style={styles.linkText}>Don't have an account? Sign up</Text>
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 48,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  link: {
    marginTop: 24,
    alignSelf: "center",
  },
  linkText: {
    color: "#007AFF",
    fontSize: 14,
  },
});
```

- [ ] **Step 4: Create signup screen**

Create `app/(auth)/signup.tsx`:
```tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link } from "expo-router";
import { useAuthStore } from "../../src/stores/authStore";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const signUp = useAuthStore((s) => s.signUp);

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password);
      Alert.alert("Success", "Check your email to confirm your account.");
    } catch (error: any) {
      Alert.alert("Signup failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Start organizing your thoughts</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSignup}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Creating account..." : "Sign Up"}
        </Text>
      </TouchableOpacity>

      <Link href="/(auth)/login" style={styles.link}>
        <Text style={styles.linkText}>Already have an account? Log in</Text>
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 48,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  link: {
    marginTop: 24,
    alignSelf: "center",
  },
  linkText: {
    color: "#007AFF",
    fontSize: 14,
  },
});
```

- [ ] **Step 5: Update root layout with auth gate**

Update `app/_layout.tsx`:
```tsx
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useAuthStore } from "../src/stores/authStore";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const { session, loading, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="category/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="item/[id]" options={{ headerShown: true, presentation: "modal" }} />
      <Stack.Screen name="health" options={{ headerShown: true }} />
    </Stack>
  );
}
```

- [ ] **Step 6: Verify auth flow works**

```bash
npx expo start
```

Expected: App loads, shows login screen. Can navigate to signup. After signup + email confirmation, user is redirected to tabs.

- [ ] **Step 7: Commit**

```bash
git add src/stores/authStore.ts app/
git commit -m "feat: add auth store, login, and signup screens"
```

---

## Task 5: Category Store & Seed Categories

**Files:**
- Create: `src/stores/categoryStore.ts`, `__tests__/stores/categoryStore.test.ts`

- [ ] **Step 1: Write failing test for category store**

Create `__tests__/stores/categoryStore.test.ts`:
```ts
import { useCategoryStore } from "../../src/stores/categoryStore";
import { SEED_CATEGORIES } from "../../src/constants/seedCategories";

// Mock supabase
jest.mock("../../src/lib/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          data: SEED_CATEGORIES.map((name, i) => ({
            id: `cat-${i}`,
            user_id: "user-1",
            name,
            parent_id: null,
            created_at: new Date().toISOString(),
          })),
          error: null,
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({ data: null, error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({ data: null, error: null })),
      })),
    })),
  },
}));

describe("categoryStore", () => {
  beforeEach(() => {
    useCategoryStore.setState({
      categories: [],
      items: [],
      loading: false,
    });
  });

  it("should initialize with empty state", () => {
    const state = useCategoryStore.getState();
    expect(state.categories).toEqual([]);
    expect(state.items).toEqual([]);
    expect(state.loading).toBe(false);
  });

  it("should group items by category", () => {
    useCategoryStore.setState({
      categories: [
        { id: "cat-1", user_id: "u1", name: "Groceries", parent_id: null, created_at: "" },
        { id: "cat-2", user_id: "u1", name: "Work", parent_id: null, created_at: "" },
      ],
      items: [
        { id: "i1", user_id: "u1", category_id: "cat-1", title: "Buy milk", raw_transcript: "", status: "pending", reminder_at: null, confidence: "high", created_at: "" },
        { id: "i2", user_id: "u1", category_id: "cat-1", title: "Buy eggs", raw_transcript: "", status: "pending", reminder_at: null, confidence: "high", created_at: "" },
        { id: "i3", user_id: "u1", category_id: "cat-2", title: "Email boss", raw_transcript: "", status: "pending", reminder_at: null, confidence: "high", created_at: "" },
      ],
    });

    const state = useCategoryStore.getState();
    const groceryItems = state.getItemsByCategory("cat-1");
    expect(groceryItems).toHaveLength(2);

    const workItems = state.getItemsByCategory("cat-2");
    expect(workItems).toHaveLength(1);
  });

  it("should get sub-categories for a parent", () => {
    useCategoryStore.setState({
      categories: [
        { id: "cat-1", user_id: "u1", name: "Work", parent_id: null, created_at: "" },
        { id: "cat-2", user_id: "u1", name: "Project Alpha", parent_id: "cat-1", created_at: "" },
        { id: "cat-3", user_id: "u1", name: "Admin", parent_id: "cat-1", created_at: "" },
      ],
      items: [],
    });

    const state = useCategoryStore.getState();
    const subCats = state.getSubCategories("cat-1");
    expect(subCats).toHaveLength(2);
    expect(subCats.map((c) => c.name)).toEqual(["Project Alpha", "Admin"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/stores/categoryStore.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement category store**

Create `src/stores/categoryStore.ts`:
```ts
import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { Category, Item } from "../types";
import { SEED_CATEGORIES } from "../constants/seedCategories";

interface CategoryState {
  categories: Category[];
  items: Item[];
  loading: boolean;
  fetchCategories: (userId: string) => Promise<void>;
  fetchItems: (userId: string) => Promise<void>;
  seedCategories: (userId: string) => Promise<void>;
  getItemsByCategory: (categoryId: string) => Item[];
  getSubCategories: (parentId: string) => Category[];
  getTopLevelCategories: () => Category[];
  toggleItemDone: (itemId: string) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  updateItemCategory: (itemId: string, categoryId: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  items: [],
  loading: false,

  fetchCategories: async (userId) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      set({ categories: data });
    }
    set({ loading: false });
  },

  fetchItems: async (userId) => {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      set({ items: data });
    }
  },

  seedCategories: async (userId) => {
    const rows = SEED_CATEGORIES.map((name) => ({
      user_id: userId,
      name,
      parent_id: null,
    }));
    const { data, error } = await supabase
      .from("categories")
      .insert(rows)
      .select();

    if (!error && data) {
      set({ categories: data });
    }
  },

  getItemsByCategory: (categoryId) => {
    const { items } = get();
    return items
      .filter((item) => item.category_id === categoryId)
      .sort((a, b) => {
        // pending items first, done items last
        if (a.status === "done" && b.status !== "done") return 1;
        if (a.status !== "done" && b.status === "done") return -1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  },

  getSubCategories: (parentId) => {
    return get().categories.filter((c) => c.parent_id === parentId);
  },

  getTopLevelCategories: () => {
    return get().categories.filter((c) => c.parent_id === null);
  },

  toggleItemDone: async (itemId) => {
    const item = get().items.find((i) => i.id === itemId);
    if (!item) return;
    const newStatus = item.status === "done" ? "pending" : "done";
    await supabase.from("items").update({ status: newStatus }).eq("id", itemId);
    set({
      items: get().items.map((i) =>
        i.id === itemId ? { ...i, status: newStatus } : i
      ),
    });
  },

  deleteItem: async (itemId) => {
    await supabase.from("items").delete().eq("id", itemId);
    set({ items: get().items.filter((i) => i.id !== itemId) });
  },

  updateItemCategory: async (itemId, categoryId) => {
    await supabase.from("items").update({ category_id: categoryId }).eq("id", itemId);
    set({
      items: get().items.map((i) =>
        i.id === itemId ? { ...i, category_id: categoryId } : i
      ),
    });
  },
}));
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/stores/categoryStore.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/stores/categoryStore.ts __tests__/stores/categoryStore.test.ts
git commit -m "feat: add category store with sub-category support"
```

---

## Task 6: Date Parser for Reminders

**Files:**
- Create: `src/lib/dateParser.ts`, `__tests__/lib/dateParser.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/dateParser.test.ts`:
```ts
import { parseReminderDate } from "../../src/lib/dateParser";

describe("parseReminderDate", () => {
  const now = new Date("2026-03-24T10:00:00Z");

  it("parses 'tomorrow' to next day at 9am", () => {
    const result = parseReminderDate("tomorrow", now);
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(25);
    expect(result!.getHours()).toBe(9);
  });

  it("parses 'next Wednesday' to the upcoming Wednesday at 9am", () => {
    // March 24, 2026 is a Tuesday. Next Wednesday is March 25.
    const result = parseReminderDate("next Wednesday", now);
    expect(result).not.toBeNull();
    expect(result!.getDay()).toBe(3); // Wednesday
    expect(result!.getHours()).toBe(9);
  });

  it("parses 'on Friday' to the upcoming Friday at 9am", () => {
    const result = parseReminderDate("on Friday", now);
    expect(result).not.toBeNull();
    expect(result!.getDay()).toBe(5);
    expect(result!.getHours()).toBe(9);
  });

  it("returns null for ambiguous references like 'soon'", () => {
    const result = parseReminderDate("soon", now);
    expect(result).toBeNull();
  });

  it("returns null for 'later'", () => {
    const result = parseReminderDate("later", now);
    expect(result).toBeNull();
  });

  it("parses 'in 2 hours' relative to now", () => {
    const result = parseReminderDate("in 2 hours", now);
    expect(result).not.toBeNull();
    expect(result!.getHours()).toBe(12);
  });

  it("parses 'today at 3pm'", () => {
    const result = parseReminderDate("today at 3pm", now);
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(24);
    expect(result!.getHours()).toBe(15);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/lib/dateParser.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Install chrono-node and implement date parser**

```bash
npm install chrono-node
```

Create `src/lib/dateParser.ts`:
```ts
import * as chrono from "chrono-node";

const AMBIGUOUS_TERMS = ["soon", "later", "eventually", "sometime", "at some point"];
const DEFAULT_HOUR = 9; // 9am default for date-only references

export function parseReminderDate(
  text: string,
  referenceDate: Date = new Date()
): Date | null {
  const lower = text.toLowerCase().trim();

  // Reject ambiguous time references
  if (AMBIGUOUS_TERMS.some((term) => lower.includes(term))) {
    return null;
  }

  const results = chrono.parse(text, referenceDate, { forwardDate: true });
  if (results.length === 0) return null;

  const parsed = results[0];
  const date = parsed.start.date();

  // If no specific time was mentioned, default to 9am
  if (
    !parsed.start.isCertain("hour") &&
    !parsed.start.isCertain("minute")
  ) {
    date.setHours(DEFAULT_HOUR, 0, 0, 0);
  }

  return date;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/lib/dateParser.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/dateParser.ts __tests__/lib/dateParser.test.ts package.json package-lock.json
git commit -m "feat: add date parser for reminder extraction"
```

---

## Task 7: AI Response Parsing

**Files:**
- Create: `src/lib/ai.ts`, `__tests__/lib/ai.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/ai.test.ts`:
```ts
import { parseAIResponse, buildCategorizationPrompt } from "../../src/lib/ai";
import { Category } from "../../src/types";

describe("parseAIResponse", () => {
  it("parses a valid JSON response into items and health entries", () => {
    const raw = JSON.stringify({
      items: [
        {
          title: "Buy milk",
          category_name: "Groceries / Shopping",
          sub_category_name: null,
          reminder_at: null,
          confidence: "high",
        },
        {
          title: "Follow up with Sarah",
          category_name: "Work Tasks",
          sub_category_name: "Project Alpha",
          reminder_at: "2026-03-25T09:00:00Z",
          confidence: "high",
        },
      ],
      health_entries: [
        {
          type: "food",
          details: { meal: "lunch", description: "salad" },
        },
      ],
    });

    const result = parseAIResponse(raw);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].title).toBe("Buy milk");
    expect(result.items[1].sub_category_name).toBe("Project Alpha");
    expect(result.health_entries).toHaveLength(1);
    expect(result.health_entries[0].type).toBe("food");
  });

  it("returns empty result for invalid JSON", () => {
    const result = parseAIResponse("not valid json at all");
    expect(result.items).toEqual([]);
    expect(result.health_entries).toEqual([]);
  });

  it("extracts JSON from markdown code blocks", () => {
    const raw = '```json\n{"items": [{"title": "Test", "category_name": "Inbox", "sub_category_name": null, "reminder_at": null, "confidence": "high"}], "health_entries": []}\n```';
    const result = parseAIResponse(raw);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe("Test");
  });
});

describe("buildCategorizationPrompt", () => {
  it("includes existing categories in the prompt", () => {
    const categories: Category[] = [
      { id: "1", user_id: "u1", name: "Groceries", parent_id: null, created_at: "" },
      { id: "2", user_id: "u1", name: "Work", parent_id: null, created_at: "" },
    ];

    const prompt = buildCategorizationPrompt("buy milk and eggs", categories);
    expect(prompt).toContain("Groceries");
    expect(prompt).toContain("Work");
    expect(prompt).toContain("buy milk and eggs");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/lib/ai.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement AI parsing module**

Create `src/lib/ai.ts`:
```ts
import { AICategorizationResult, AIExtractedItem, AIExtractedHealthEntry, Category } from "../types";

const EMPTY_RESULT: AICategorizationResult = { items: [], health_entries: [] };

export function parseAIResponse(raw: string): AICategorizationResult {
  try {
    // Strip markdown code blocks if present
    let cleaned = raw.trim();
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1].trim();
    }

    const parsed = JSON.parse(cleaned);

    const items: AIExtractedItem[] = (parsed.items || []).map((item: any) => ({
      title: item.title || "",
      category_name: item.category_name || "Inbox",
      sub_category_name: item.sub_category_name || null,
      reminder_at: item.reminder_at || null,
      confidence: item.confidence === "low" ? "low" : "high",
    }));

    const health_entries: AIExtractedHealthEntry[] = (parsed.health_entries || []).map(
      (entry: any) => ({
        type: entry.type === "exercise" ? "exercise" : "food",
        details: entry.details || {},
      })
    );

    return { items, health_entries };
  } catch {
    return EMPTY_RESULT;
  }
}

export function buildCategorizationPrompt(
  transcript: string,
  existingCategories: Category[]
): string {
  const categoryList = existingCategories
    .filter((c) => c.parent_id === null)
    .map((parent) => {
      const subs = existingCategories
        .filter((c) => c.parent_id === parent.id)
        .map((c) => c.name);
      if (subs.length > 0) {
        return `- ${parent.name} (sub-categories: ${subs.join(", ")})`;
      }
      return `- ${parent.name}`;
    })
    .join("\n");

  return `You are a personal assistant that organizes thoughts into categories.

Given the following voice note transcript, extract all actionable items, categorize them, and identify any health/fitness entries.

EXISTING CATEGORIES:
${categoryList}

RULES:
- Map items to existing categories when possible.
- If no existing category fits, create a new category name.
- If a sub-category is appropriate (e.g., a specific project under "Work Tasks"), include it.
- If the transcript mentions food or exercise, create health_entries in addition to any items.
- If a time/date is mentioned for a task, include it as reminder_at in ISO 8601 format.
- If you are not confident about a categorization, set confidence to "low".
- Extract concise, actionable titles from the transcript.

TRANSCRIPT:
"${transcript}"

Respond ONLY with valid JSON in this exact format:
{
  "items": [
    {
      "title": "concise action item",
      "category_name": "Category Name",
      "sub_category_name": "Sub Category Name or null",
      "reminder_at": "ISO 8601 datetime or null",
      "confidence": "high or low"
    }
  ],
  "health_entries": [
    {
      "type": "food or exercise",
      "details": {
        "meal": "breakfast/lunch/dinner/snack",
        "description": "what was eaten"
      }
    }
  ]
}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/lib/ai.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai.ts __tests__/lib/ai.test.ts
git commit -m "feat: add AI response parsing and prompt builder"
```

---

## Task 8: Supabase Edge Function for Categorization

**Files:**
- Create: `supabase/functions/categorize/index.ts`

- [ ] **Step 1: Install Supabase CLI**

```bash
npm install -g supabase
supabase init
```

- [ ] **Step 2: Create the edge function**

```bash
supabase functions new categorize
```

- [ ] **Step 3: Write the edge function**

Create `supabase/functions/categorize/index.ts`:
```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  try {
    const { transcript, user_id, voice_note_id } = await req.json();

    if (!transcript || !user_id) {
      return new Response(JSON.stringify({ error: "Missing transcript or user_id" }), {
        status: 400,
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch user's existing categories
    const { data: categories } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at");

    // Build category context for prompt
    const categoryList = (categories || [])
      .filter((c: any) => c.parent_id === null)
      .map((parent: any) => {
        const subs = (categories || [])
          .filter((c: any) => c.parent_id === parent.id)
          .map((c: any) => c.name);
        if (subs.length > 0) {
          return `- ${parent.name} (sub-categories: ${subs.join(", ")})`;
        }
        return `- ${parent.name}`;
      })
      .join("\n");

    const prompt = `You are a personal assistant that organizes thoughts into categories.

Given the following voice note transcript, extract all actionable items, categorize them, and identify any health/fitness entries.

EXISTING CATEGORIES:
${categoryList}

RULES:
- Map items to existing categories when possible.
- If no existing category fits, create a new category name.
- If a sub-category is appropriate (e.g., a specific project under "Work Tasks"), include it.
- If the transcript mentions food or exercise, create health_entries in addition to any items.
- If a time/date is mentioned for a task, include it as reminder_at in ISO 8601 format.
- If you are not confident about a categorization, set confidence to "low".
- Extract concise, actionable titles from the transcript.

TRANSCRIPT:
"${transcript}"

Respond ONLY with valid JSON in this exact format:
{
  "items": [
    {
      "title": "concise action item",
      "category_name": "Category Name",
      "sub_category_name": "Sub Category Name or null",
      "reminder_at": "ISO 8601 datetime or null",
      "confidence": "high or low"
    }
  ],
  "health_entries": [
    {
      "type": "food or exercise",
      "details": {}
    }
  ]
}`;

    // Call Haiku 4.5
    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const aiData = await aiResponse.json();
    const rawText = aiData.content?.[0]?.text || "{}";

    // Parse AI response
    let parsed;
    try {
      let cleaned = rawText.trim();
      const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) cleaned = codeBlockMatch[1].trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // If parsing fails, create a single Inbox item
      parsed = {
        items: [
          {
            title: transcript.slice(0, 100),
            category_name: "Inbox",
            sub_category_name: null,
            reminder_at: null,
            confidence: "low",
          },
        ],
        health_entries: [],
      };
    }

    const createdItems = [];

    // Process each extracted item
    for (const item of parsed.items || []) {
      // Find or create category
      let category = (categories || []).find(
        (c: any) => c.name.toLowerCase() === item.category_name.toLowerCase() && c.parent_id === null
      );

      if (!category) {
        const { data: newCat } = await supabase
          .from("categories")
          .insert({ user_id, name: item.category_name, parent_id: null })
          .select()
          .single();
        category = newCat;
      }

      // Find or create sub-category if specified
      let categoryId = category?.id;
      if (item.sub_category_name && category) {
        let subCat = (categories || []).find(
          (c: any) =>
            c.name.toLowerCase() === item.sub_category_name.toLowerCase() &&
            c.parent_id === category!.id
        );
        if (!subCat) {
          const { data: newSub } = await supabase
            .from("categories")
            .insert({
              user_id,
              name: item.sub_category_name,
              parent_id: category.id,
            })
            .select()
            .single();
          subCat = newSub;
        }
        if (subCat) categoryId = subCat.id;
      }

      // Create the item
      const { data: newItem } = await supabase
        .from("items")
        .insert({
          user_id,
          category_id: categoryId,
          title: item.title,
          raw_transcript: transcript,
          status: "pending",
          reminder_at: item.reminder_at || null,
          confidence: item.confidence || "high",
        })
        .select()
        .single();

      if (newItem) {
        createdItems.push(newItem);

        // Link to voice note if provided
        if (voice_note_id) {
          await supabase.from("voice_note_items").insert({
            voice_note_id,
            item_id: newItem.id,
          });
        }
      }
    }

    // Process health entries
    for (const entry of parsed.health_entries || []) {
      await supabase.from("health_entries").insert({
        user_id,
        type: entry.type,
        details: entry.details,
      });
    }

    return new Response(
      JSON.stringify({
        items: createdItems,
        health_entries_count: (parsed.health_entries || []).length,
        categories_created: [], // could track new ones if needed
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
```

- [ ] **Step 4: Set edge function secrets**

```bash
supabase secrets set ANTHROPIC_API_KEY=your-key-here
```

- [ ] **Step 5: Deploy and test the edge function**

```bash
supabase functions deploy categorize
```

Test with curl:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/categorize \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"transcript": "I need to buy milk and eggs and also follow up with Sarah about the proposal on Wednesday", "user_id": "test-user-id"}'
```

Expected: JSON response with extracted items.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/categorize/index.ts
git commit -m "feat: add categorize edge function with Haiku 4.5"
```

---

## Task 9: Voice Recording & Transcription

**Files:**
- Create: `src/lib/recorder.ts`, `src/lib/transcriber.ts`, `src/stores/recordingStore.ts`

- [ ] **Step 1: Create audio recorder wrapper**

Create `src/lib/recorder.ts`:
```ts
import { Audio } from "expo-av";

let recording: Audio.Recording | null = null;

export async function startRecording(): Promise<void> {
  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Microphone permission not granted");
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording: newRecording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );
  recording = newRecording;
}

export async function stopRecording(): Promise<{ uri: string; duration: number }> {
  if (!recording) throw new Error("No recording in progress");

  await recording.stopAndUnloadAsync();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

  const uri = recording.getURI();
  const status = await recording.getStatusAsync();
  const duration = (status as any).durationMillis / 1000;

  recording = null;

  if (!uri) throw new Error("Recording failed — no URI");

  return { uri, duration };
}

export function isRecording(): boolean {
  return recording !== null;
}
```

- [ ] **Step 2: Create speech-to-text wrapper**

Create `src/lib/transcriber.ts`:
```ts
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

export async function requestTranscriptionPermission(): Promise<boolean> {
  const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  return result.granted;
}

export function startTranscription(): void {
  ExpoSpeechRecognitionModule.start({
    lang: "en-US",
    interimResults: true,
    continuous: true,
  });
}

export function stopTranscription(): void {
  ExpoSpeechRecognitionModule.stop();
}

// Hook to be used in components
export { useSpeechRecognitionEvent };
```

- [ ] **Step 3: Create recording store**

Create `src/stores/recordingStore.ts`:
```ts
import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { AICategorizationResult } from "../types";
import { parseAIResponse } from "../lib/ai";

type ProcessingStatus = "idle" | "recording" | "transcribing" | "categorizing" | "done" | "error";

interface RecordingState {
  status: ProcessingStatus;
  transcript: string;
  audioUri: string | null;
  duration: number;
  result: AICategorizationResult | null;
  error: string | null;

  setStatus: (status: ProcessingStatus) => void;
  setTranscript: (transcript: string) => void;
  setAudioUri: (uri: string, duration: number) => void;
  categorize: (userId: string) => Promise<void>;
  reset: () => void;
}

export const useRecordingStore = create<RecordingState>((set, get) => ({
  status: "idle",
  transcript: "",
  audioUri: null,
  duration: 0,
  result: null,
  error: null,

  setStatus: (status) => set({ status }),
  setTranscript: (transcript) => set({ transcript }),
  setAudioUri: (uri, duration) => set({ audioUri: uri, duration }),

  categorize: async (userId) => {
    const { transcript, audioUri, duration } = get();

    if (!transcript.trim()) {
      set({ status: "error", error: "No speech detected — try again?" });
      return;
    }

    set({ status: "categorizing" });

    try {
      // Upload audio to Supabase Storage
      let voiceNoteId: string | null = null;
      if (audioUri) {
        const fileName = `${userId}/${Date.now()}.m4a`;
        const response = await fetch(audioUri);
        const blob = await response.blob();
        const { error: uploadError } = await supabase.storage
          .from("voice-notes")
          .upload(fileName, blob);

        if (!uploadError) {
          const { data: vnData } = await supabase
            .from("voice_notes")
            .insert({
              user_id: userId,
              storage_path: fileName,
              duration,
            })
            .select()
            .single();
          voiceNoteId = vnData?.id || null;
        }
      }

      // Call categorize edge function
      const { data, error } = await supabase.functions.invoke("categorize", {
        body: {
          transcript,
          user_id: userId,
          voice_note_id: voiceNoteId,
        },
      });

      if (error) throw error;

      set({
        status: "done",
        result: {
          items: data.items || [],
          health_entries: [],
        },
      });
    } catch (err: any) {
      set({
        status: "error",
        error: err.message || "Failed to categorize. Your note has been saved.",
      });
    }
  },

  reset: () =>
    set({
      status: "idle",
      transcript: "",
      audioUri: null,
      duration: 0,
      result: null,
      error: null,
    }),
}));
```

- [ ] **Step 4: Create Supabase storage bucket**

Go to Supabase Dashboard → Storage → Create bucket named `voice-notes` (private).

- [ ] **Step 5: Commit**

```bash
git add src/lib/recorder.ts src/lib/transcriber.ts src/stores/recordingStore.ts
git commit -m "feat: add voice recording, transcription, and recording store"
```

---

## Task 10: Record Screen

**Files:**
- Create: `app/(tabs)/record.tsx`, `src/components/RecordButton.tsx`, `src/components/ConfirmationCard.tsx`

- [ ] **Step 1: Create the record button component**

Create `src/components/RecordButton.tsx`:
```tsx
import { TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useRef, useEffect } from "react";

interface Props {
  isRecording: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function RecordButton({ isRecording, onPress, disabled }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scale.setValue(1);
    }
  }, [isRecording]);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.button,
          isRecording && styles.recording,
          disabled && styles.disabled,
          { transform: [{ scale }] },
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FF3B30",
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recording: {
    backgroundColor: "#FF6B6B",
  },
  disabled: {
    opacity: 0.5,
  },
});
```

- [ ] **Step 2: Create the confirmation card component**

Create `src/components/ConfirmationCard.tsx`:
```tsx
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Item } from "../types";

interface Props {
  items: Item[];
  onDismiss: () => void;
  onRecategorize: (itemId: string) => void;
}

export function ConfirmationCard({ items, onDismiss, onRecategorize }: Props) {
  // Group items by category
  const grouped = items.reduce<Record<string, Item[]>>((acc, item) => {
    const key = item.category_id || "uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Added {items.length} item{items.length !== 1 ? "s" : ""}</Text>
        <TouchableOpacity onPress={onDismiss}>
          <Text style={styles.dismiss}>Done</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.list}>
        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              {item.confidence === "low" && (
                <Text style={styles.lowConfidence}>Needs review</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => onRecategorize(item.id)}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 300,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  dismiss: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  list: {
    maxHeight: 200,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
  },
  lowConfidence: {
    fontSize: 12,
    color: "#FF9500",
    marginTop: 2,
  },
  editButton: {
    color: "#007AFF",
    fontSize: 14,
    marginLeft: 12,
  },
});
```

- [ ] **Step 3: Create the record screen**

Create `app/(tabs)/record.tsx`:
```tsx
import { View, Text, StyleSheet } from "react-native";
import { useCallback, useState } from "react";
import { useSpeechRecognitionEvent } from "expo-speech-recognition";
import { RecordButton } from "../../src/components/RecordButton";
import { ConfirmationCard } from "../../src/components/ConfirmationCard";
import { useRecordingStore } from "../../src/stores/recordingStore";
import { useAuthStore } from "../../src/stores/authStore";
import { useCategoryStore } from "../../src/stores/categoryStore";
import * as recorder from "../../src/lib/recorder";
import * as transcriber from "../../src/lib/transcriber";

export default function RecordScreen() {
  const session = useAuthStore((s) => s.session);
  const {
    status,
    transcript,
    result,
    error,
    setStatus,
    setTranscript,
    setAudioUri,
    categorize,
    reset,
  } = useRecordingStore();
  const { fetchCategories, fetchItems } = useCategoryStore();

  const [liveTranscript, setLiveTranscript] = useState("");

  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results[0]?.transcript || "";
    setLiveTranscript(text);
    if (event.isFinal) {
      setTranscript(text);
    }
  });

  useSpeechRecognitionEvent("end", () => {
    // Transcription ended
  });

  const handlePress = useCallback(async () => {
    if (status === "recording") {
      // Stop
      transcriber.stopTranscription();
      const { uri, duration } = await recorder.stopRecording();
      setAudioUri(uri, duration);
      setStatus("transcribing");

      // The transcript is set by the speech recognition event
      // Proceed to categorize
      if (session?.user?.id) {
        await categorize(session.user.id);
        await fetchCategories(session.user.id);
        await fetchItems(session.user.id);
      }
    } else if (status === "idle" || status === "done" || status === "error") {
      // Start
      reset();
      setLiveTranscript("");
      setStatus("recording");

      const hasPermission = await transcriber.requestTranscriptionPermission();
      if (!hasPermission) {
        setStatus("error");
        return;
      }

      await recorder.startRecording();
      transcriber.startTranscription();
    }
  }, [status, session]);

  const handleDismiss = () => {
    reset();
    setLiveTranscript("");
  };

  const statusText: Record<string, string> = {
    idle: "Tap to speak",
    recording: "Listening...",
    transcribing: "Processing...",
    categorizing: "Organizing your thoughts...",
    done: "Done!",
    error: error || "Something went wrong",
  };

  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>{statusText[status]}</Text>

      {(status === "recording" || liveTranscript) && (
        <Text style={styles.transcript}>
          {liveTranscript || "Speak now..."}
        </Text>
      )}

      <RecordButton
        isRecording={status === "recording"}
        onPress={handlePress}
        disabled={status === "transcribing" || status === "categorizing"}
      />

      {status === "done" && result && result.items.length > 0 && (
        <ConfirmationCard
          items={result.items as any}
          onDismiss={handleDismiss}
          onRecategorize={() => {}}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 24,
  },
  statusText: {
    fontSize: 20,
    color: "#333",
    marginBottom: 48,
    fontWeight: "500",
  },
  transcript: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 24,
    maxHeight: 120,
  },
});
```

- [ ] **Step 4: Verify record screen renders**

```bash
npx expo start
```

Expected: Record tab shows mic button, tapping it starts recording and shows live transcript.

- [ ] **Step 5: Commit**

```bash
git add src/components/RecordButton.tsx src/components/ConfirmationCard.tsx app/\(tabs\)/record.tsx
git commit -m "feat: add record screen with voice capture and confirmation card"
```

---

## Task 11: Home Screen — Category Feeds

**Files:**
- Create: `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `src/components/CategoryCard.tsx`

- [ ] **Step 1: Create tab layout**

Create `app/(tabs)/_layout.tsx`:
```tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: "Record",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mic" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Create category card component**

Create `src/components/CategoryCard.tsx`:
```tsx
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Category, Item } from "../types";

interface Props {
  category: Category;
  itemCount: number;
  pendingCount: number;
}

export function CategoryCard({ category, itemCount, pendingCount }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/category/${category.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.info}>
        <Text style={styles.name}>{category.name}</Text>
        <Text style={styles.count}>
          {pendingCount} pending{itemCount > pendingCount ? ` / ${itemCount} total` : ""}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );
}

import { Ionicons } from "@expo/vector-icons";

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  count: {
    fontSize: 13,
    color: "#888",
  },
});
```

- [ ] **Step 3: Create home screen**

Create `app/(tabs)/index.tsx`:
```tsx
import { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useAuthStore } from "../../src/stores/authStore";
import { useCategoryStore } from "../../src/stores/categoryStore";
import { CategoryCard } from "../../src/components/CategoryCard";

export default function HomeScreen() {
  const session = useAuthStore((s) => s.session);
  const {
    categories,
    items,
    loading,
    fetchCategories,
    fetchItems,
    seedCategories,
    getTopLevelCategories,
    getItemsByCategory,
    getSubCategories,
  } = useCategoryStore();

  const userId = session?.user?.id;

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadData = async () => {
    if (!userId) return;
    await fetchCategories(userId);

    // Seed categories on first use
    const state = useCategoryStore.getState();
    if (state.categories.length === 0) {
      await seedCategories(userId);
    }

    await fetchItems(userId);
  };

  const topLevelCategories = getTopLevelCategories();

  const getCategoryItemCount = (categoryId: string): { total: number; pending: number } => {
    // Include items from sub-categories
    const subCats = getSubCategories(categoryId);
    const allCategoryIds = [categoryId, ...subCats.map((c) => c.id)];
    const categoryItems = items.filter((i) => allCategoryIds.includes(i.category_id));
    return {
      total: categoryItems.length,
      pending: categoryItems.filter((i) => i.status === "pending").length,
    };
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={topLevelCategories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const counts = getCategoryItemCount(item.id);
          return (
            <CategoryCard
              category={item}
              itemCount={counts.total}
              pendingCount={counts.pending}
            />
          );
        }}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No categories yet. Record a voice note to get started!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  list: {
    paddingVertical: 12,
  },
  empty: {
    padding: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
});
```

- [ ] **Step 4: Verify home screen renders with categories**

```bash
npx expo start
```

Expected: Home tab shows list of seed categories. Pull-to-refresh works.

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/_layout.tsx app/\(tabs\)/index.tsx src/components/CategoryCard.tsx
git commit -m "feat: add home screen with auto-categorized feeds"
```

---

## Task 12: Category Detail & Item Management

**Files:**
- Create: `app/category/[id].tsx`, `app/item/[id].tsx`, `src/components/ItemRow.tsx`

- [ ] **Step 1: Create item row component with swipe actions**

Create `src/components/ItemRow.tsx`:
```tsx
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Item } from "../types";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  item: Item;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPress: (id: string) => void;
}

export function ItemRow({ item, onToggle, onDelete, onPress }: Props) {
  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => onDelete(item.id)}
    >
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity
        style={styles.row}
        onPress={() => onPress(item.id)}
        activeOpacity={0.7}
      >
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => onToggle(item.id)}
        >
          <Ionicons
            name={item.status === "done" ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={item.status === "done" ? "#34C759" : "#ccc"}
          />
        </TouchableOpacity>
        <View style={styles.content}>
          <Text
            style={[styles.title, item.status === "done" && styles.doneTitle]}
          >
            {item.title}
          </Text>
          {item.reminder_at && (
            <Text style={styles.reminder}>
              Reminder: {new Date(item.reminder_at).toLocaleDateString()}
            </Text>
          )}
          {item.confidence === "low" && (
            <Text style={styles.lowConfidence}>Needs review</Text>
          )}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  checkbox: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
  },
  doneTitle: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  reminder: {
    fontSize: 12,
    color: "#007AFF",
    marginTop: 4,
  },
  lowConfidence: {
    fontSize: 12,
    color: "#FF9500",
    marginTop: 2,
  },
  deleteAction: {
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "600",
  },
});
```

- [ ] **Step 2: Create category detail screen**

Create `app/category/[id].tsx`:
```tsx
import { useLocalSearchParams, Stack } from "expo-router";
import { View, Text, SectionList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useCategoryStore } from "../../src/stores/categoryStore";
import { ItemRow } from "../../src/components/ItemRow";

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    categories,
    getItemsByCategory,
    getSubCategories,
    toggleItemDone,
    deleteItem,
  } = useCategoryStore();

  const category = categories.find((c) => c.id === id);
  const subCategories = getSubCategories(id!);

  // Build sections: top-level items + sub-category groups
  const topLevelItems = getItemsByCategory(id!);
  const sections = [
    ...(topLevelItems.length > 0
      ? [{ title: "", data: topLevelItems }]
      : []),
    ...subCategories.map((sub) => ({
      title: sub.name,
      data: getItemsByCategory(sub.id),
    })),
  ].filter((s) => s.data.length > 0);

  return (
    <>
      <Stack.Screen options={{ title: category?.name || "Category" }} />
      <View style={styles.container}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemRow
              item={item}
              onToggle={toggleItemDone}
              onDelete={deleteItem}
              onPress={(itemId) => router.push(`/item/${itemId}`)}
            />
          )}
          renderSectionHeader={({ section: { title } }) =>
            title ? (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No items yet</Text>
            </View>
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  sectionHeader: {
    backgroundColor: "#F0F0F0",
    padding: 10,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
  },
  empty: {
    padding: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});
```

- [ ] **Step 3: Create item detail/edit screen**

Create `app/item/[id].tsx`:
```tsx
import { useState } from "react";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useCategoryStore } from "../../src/stores/categoryStore";

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { items, categories, deleteItem, updateItemCategory } =
    useCategoryStore();

  const item = items.find((i) => i.id === id);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    item?.category_id || ""
  );

  if (!item) {
    return (
      <View style={styles.container}>
        <Text>Item not found</Text>
      </View>
    );
  }

  const topLevelCategories = categories.filter((c) => c.parent_id === null);

  const handleRecategorize = async () => {
    if (selectedCategoryId !== item.category_id) {
      await updateItemCategory(item.id, selectedCategoryId);
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert("Delete item", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteItem(item.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Item Details" }} />
      <ScrollView style={styles.container}>
        <Text style={styles.label}>Title</Text>
        <Text style={styles.title}>{item.title}</Text>

        {item.raw_transcript ? (
          <>
            <Text style={styles.label}>Original transcript</Text>
            <Text style={styles.transcript}>{item.raw_transcript}</Text>
          </>
        ) : null}

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryList}>
          {topLevelCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategoryId === cat.id && styles.selectedChip,
              ]}
              onPress={() => setSelectedCategoryId(cat.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedCategoryId === cat.id && styles.selectedChipText,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedCategoryId !== item.category_id && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleRecategorize}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Item</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    marginTop: 20,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "500",
  },
  transcript: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  categoryList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
  },
  selectedChip: {
    backgroundColor: "#007AFF",
  },
  chipText: {
    fontSize: 14,
    color: "#333",
  },
  selectedChipText: {
    color: "#fff",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  deleteButtonText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "500",
  },
});
```

- [ ] **Step 4: Verify category detail and item management work**

```bash
npx expo start
```

Expected: Tapping a category on home shows its items with sub-category sections. Items can be checked off, swiped to delete, tapped to edit/recategorize.

- [ ] **Step 5: Commit**

```bash
git add src/components/ItemRow.tsx app/category/\[id\].tsx app/item/\[id\].tsx
git commit -m "feat: add category detail, item management, and item detail screens"
```

---

## Task 13: Health & Fitness Dashboard

**Files:**
- Create: `src/stores/healthStore.ts`, `src/components/HealthDailyLog.tsx`, `src/components/WeeklySummaryCard.tsx`, `app/health/index.tsx`

- [ ] **Step 1: Create health store**

Create `src/stores/healthStore.ts`:
```ts
import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { HealthEntry } from "../types";

interface HealthState {
  entries: HealthEntry[];
  loading: boolean;
  fetchEntries: (userId: string) => Promise<void>;
  getEntriesForDate: (date: string) => HealthEntry[];
  getEntriesForWeek: () => HealthEntry[];
}

export const useHealthStore = create<HealthState>((set, get) => ({
  entries: [],
  loading: false,

  fetchEntries: async (userId) => {
    set({ loading: true });
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from("health_entries")
      .select("*")
      .eq("user_id", userId)
      .gte("logged_at", sevenDaysAgo.toISOString())
      .order("logged_at", { ascending: false });

    if (!error && data) {
      set({ entries: data });
    }
    set({ loading: false });
  },

  getEntriesForDate: (date) => {
    return get().entries.filter(
      (e) => new Date(e.logged_at).toDateString() === new Date(date).toDateString()
    );
  },

  getEntriesForWeek: () => {
    return get().entries;
  },
}));
```

- [ ] **Step 2: Create weekly summary card**

Create `src/components/WeeklySummaryCard.tsx`:
```tsx
import { View, Text, StyleSheet } from "react-native";
import { HealthEntry } from "../types";

interface Props {
  entries: HealthEntry[];
}

export function WeeklySummaryCard({ entries }: Props) {
  const exerciseCount = entries.filter((e) => e.type === "exercise").length;
  const foodCount = entries.filter((e) => e.type === "food").length;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>This Week</Text>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{exerciseCount}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{foodCount}</Text>
          <Text style={styles.statLabel}>Meals Logged</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#E8F5E9",
    borderRadius: 16,
    padding: 20,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
});
```

- [ ] **Step 3: Create daily log component**

Create `src/components/HealthDailyLog.tsx`:
```tsx
import { View, Text, StyleSheet } from "react-native";
import { HealthEntry, FoodDetails, ExerciseDetails } from "../types";

interface Props {
  date: string;
  entries: HealthEntry[];
}

export function HealthDailyLog({ date, entries }: Props) {
  const dateLabel = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <View style={styles.container}>
      <Text style={styles.date}>{dateLabel}</Text>
      {entries.map((entry) => (
        <View key={entry.id} style={styles.entry}>
          <Text style={styles.entryType}>
            {entry.type === "food" ? "🍽" : "💪"}
          </Text>
          <Text style={styles.entryDetail}>
            {entry.type === "food"
              ? `${(entry.details as FoodDetails).meal}: ${(entry.details as FoodDetails).description}`
              : `${(entry.details as ExerciseDetails).activity}${
                  (entry.details as ExerciseDetails).duration_minutes
                    ? ` — ${(entry.details as ExerciseDetails).duration_minutes} min`
                    : ""
                }`}
          </Text>
        </View>
      ))}
      {entries.length === 0 && (
        <Text style={styles.noEntries}>No entries</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  date: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 4,
  },
  entryType: {
    fontSize: 18,
    marginRight: 10,
  },
  entryDetail: {
    fontSize: 15,
    color: "#444",
    flex: 1,
  },
  noEntries: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    paddingHorizontal: 12,
  },
});
```

- [ ] **Step 4: Create health dashboard screen**

Create `app/health/index.tsx`:
```tsx
import { useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { useAuthStore } from "../../src/stores/authStore";
import { useHealthStore } from "../../src/stores/healthStore";
import { WeeklySummaryCard } from "../../src/components/WeeklySummaryCard";
import { HealthDailyLog } from "../../src/components/HealthDailyLog";

export default function HealthScreen() {
  const session = useAuthStore((s) => s.session);
  const { entries, fetchEntries, getEntriesForDate } = useHealthStore();

  useEffect(() => {
    if (session?.user?.id) {
      fetchEntries(session.user.id);
    }
  }, [session]);

  // Generate last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString();
  });

  return (
    <>
      <Stack.Screen options={{ title: "Health & Fitness" }} />
      <ScrollView style={styles.container}>
        <WeeklySummaryCard entries={entries} />
        {days.map((day) => (
          <HealthDailyLog
            key={day}
            date={day}
            entries={getEntriesForDate(day)}
          />
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
});
```

- [ ] **Step 5: Link Health category to health dashboard**

Update the `CategoryCard` component to navigate to `/health` when the "Health & Fitness" category is tapped. In `src/components/CategoryCard.tsx`, update the `onPress`:

```tsx
onPress={() => {
  if (category.name === "Health & Fitness") {
    router.push("/health");
  } else {
    router.push(`/category/${category.id}`);
  }
}}
```

- [ ] **Step 6: Verify health dashboard**

```bash
npx expo start
```

Expected: Tapping "Health & Fitness" category opens the health dashboard with weekly summary and daily log.

- [ ] **Step 7: Commit**

```bash
git add src/stores/healthStore.ts src/components/WeeklySummaryCard.tsx src/components/HealthDailyLog.tsx app/health/index.tsx src/components/CategoryCard.tsx
git commit -m "feat: add health dashboard with daily log and weekly summary"
```

---

## Task 14: Push Notifications for Reminders

**Files:**
- Create: `src/lib/notifications.ts`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Create notifications helper**

Create `src/lib/notifications.ts`:
```ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("reminders", {
      name: "Reminders",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

export async function scheduleReminder(
  title: string,
  date: Date,
  itemId: string
): Promise<string> {
  const trigger = date.getTime() - Date.now();

  if (trigger <= 0) {
    // Date is in the past, skip
    return "";
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "brAIndump Reminder",
      body: title,
      data: { itemId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.floor(trigger / 1000),
    },
  });

  return id;
}

export async function cancelReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
```

- [ ] **Step 2: Register for notifications on app start**

Add to `app/_layout.tsx`, inside the first `useEffect`:

```tsx
import { registerForPushNotifications } from "../src/lib/notifications";

// Inside the useEffect after initialize():
registerForPushNotifications();
```

- [ ] **Step 3: Schedule reminders after categorization**

In `src/stores/recordingStore.ts`, after items are created, schedule notifications for any items with `reminder_at`. Add to the `categorize` function, after the edge function response:

```ts
import { scheduleReminder } from "../lib/notifications";

// After items are created:
for (const item of data.items || []) {
  if (item.reminder_at) {
    await scheduleReminder(item.title, new Date(item.reminder_at), item.id);
  }
}
```

- [ ] **Step 4: Verify notifications schedule correctly**

```bash
npx expo start
```

Record a voice note like "remind me to call mom tomorrow at 3pm." Verify a notification is scheduled.

- [ ] **Step 5: Commit**

```bash
git add src/lib/notifications.ts src/stores/recordingStore.ts app/_layout.tsx
git commit -m "feat: add push notification reminders for time-referenced items"
```

---

## Task 15: Low-Confidence Nudges

**Files:**
- Create: `src/components/NudgePrompt.tsx`
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Create nudge prompt component**

Create `src/components/NudgePrompt.tsx`:
```tsx
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Item, Category } from "../types";

interface Props {
  item: Item;
  categories: Category[];
  onSelect: (itemId: string, categoryId: string) => void;
  onDismiss: (itemId: string) => void;
}

export function NudgePrompt({ item, categories, onSelect, onDismiss }: Props) {
  const topLevel = categories.filter((c) => c.parent_id === null);

  return (
    <View style={styles.container}>
      <Text style={styles.question}>
        Where does "{item.title}" belong?
      </Text>
      <View style={styles.options}>
        {topLevel.slice(0, 4).map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.option}
            onPress={() => onSelect(item.id, cat.id)}
          >
            <Text style={styles.optionText}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={styles.dismiss}
        onPress={() => onDismiss(item.id)}
      >
        <Text style={styles.dismissText}>Keep as is</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF9E6",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  question: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 12,
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  optionText: {
    fontSize: 14,
    color: "#333",
  },
  dismiss: {
    marginTop: 12,
    alignSelf: "center",
  },
  dismissText: {
    fontSize: 13,
    color: "#999",
  },
});
```

- [ ] **Step 2: Show nudges on home screen**

Update `app/(tabs)/index.tsx` to show low-confidence items at the top of the feed:

Add before the FlatList:

```tsx
import { NudgePrompt } from "../../src/components/NudgePrompt";

// Inside the component:
const lowConfidenceItems = items.filter((i) => i.confidence === "low" && i.status === "pending");

// In the JSX, add as ListHeaderComponent of the FlatList:
ListHeaderComponent={
  <>
    {lowConfidenceItems.map((item) => (
      <NudgePrompt
        key={item.id}
        item={item}
        categories={categories}
        onSelect={async (itemId, categoryId) => {
          await updateItemCategory(itemId, categoryId);
          // Mark as high confidence after user resolves
          await supabase.from("items").update({ confidence: "high" }).eq("id", itemId);
          await fetchItems(userId!);
        }}
        onDismiss={async (itemId) => {
          await supabase.from("items").update({ confidence: "high" }).eq("id", itemId);
          await fetchItems(userId!);
        }}
      />
    ))}
  </>
}
```

- [ ] **Step 3: Verify nudges appear for low-confidence items**

```bash
npx expo start
```

Expected: Any item marked as low-confidence shows a nudge banner at the top of the home screen.

- [ ] **Step 4: Commit**

```bash
git add src/components/NudgePrompt.tsx app/\(tabs\)/index.tsx
git commit -m "feat: add low-confidence nudge prompts on home screen"
```

---

## Task 16: Settings Screen & Onboarding

**Files:**
- Create: `app/(tabs)/settings.tsx`, `app/onboarding.tsx`

- [ ] **Step 1: Create settings screen**

Create `app/(tabs)/settings.tsx`:
```tsx
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useAuthStore } from "../../src/stores/authStore";

export default function SettingsScreen() {
  const { session, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Account</Text>
        <Text style={styles.value}>{session?.user?.email}</Text>
      </View>

      <TouchableOpacity style={styles.signOut} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    padding: 20,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: "#888",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
  },
  signOut: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  signOutText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "500",
  },
});
```

- [ ] **Step 2: Create onboarding screen**

Create `app/onboarding.tsx`:
```tsx
import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    title: "Dump your thoughts",
    description:
      "Just talk. brAIndump captures your voice and turns it into organized actions, lists, and logs.",
  },
  {
    title: "Everything in its place",
    description:
      "Your thoughts are automatically sorted into categories — groceries, work tasks, health tracking, and more.",
  },
];

export default function OnboardingScreen() {
  const [page, setPage] = useState(0);
  const router = useRouter();

  const handleNext = async () => {
    if (page < SLIDES.length - 1) {
      setPage(page + 1);
    } else {
      await AsyncStorage.setItem("onboarding_complete", "true");
      router.replace("/(tabs)");
    }
  };

  const slide = SLIDES[page];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === page && styles.activeDot]}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {page === SLIDES.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "space-between",
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 17,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    alignItems: "center",
    paddingBottom: 20,
  },
  dots: {
    flexDirection: "row",
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ddd",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#007AFF",
    width: 24,
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});
```

- [ ] **Step 3: Install AsyncStorage**

```bash
npx expo install @react-native-async-storage/async-storage
```

- [ ] **Step 4: Gate onboarding in root layout**

Update `app/_layout.tsx` to check onboarding status and redirect new users:

```tsx
import AsyncStorage from "@react-native-async-storage/async-storage";

// Inside the auth redirect useEffect, after the session check:
if (session && !inAuthGroup) {
  const onboarded = await AsyncStorage.getItem("onboarding_complete");
  if (!onboarded) {
    router.replace("/onboarding");
    return;
  }
  router.replace("/(tabs)");
}
```

- [ ] **Step 5: Verify full flow: signup → onboarding → home**

```bash
npx expo start
```

Expected: New user signs up → sees 2-page tutorial → taps "Get Started" → lands on home screen with seed categories.

- [ ] **Step 6: Commit**

```bash
git add app/\(tabs\)/settings.tsx app/onboarding.tsx app/_layout.tsx package.json package-lock.json
git commit -m "feat: add settings screen and onboarding tutorial"
```

---

## Task 17: Offline Queue for Voice Notes

**Files:**
- Modify: `src/stores/recordingStore.ts`

- [ ] **Step 1: Add offline queue to recording store**

Update `src/stores/recordingStore.ts` to detect connectivity and queue:

```ts
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "braindump_offline_queue";

interface QueuedNote {
  transcript: string;
  audioUri: string;
  duration: number;
  timestamp: string;
}

async function getQueue(): Promise<QueuedNote[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function addToQueue(note: QueuedNote): Promise<void> {
  const queue = await getQueue();
  queue.push(note);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
```

Then update the `categorize` method to check connectivity:

```ts
categorize: async (userId) => {
  const { transcript, audioUri, duration } = get();

  if (!transcript.trim()) {
    set({ status: "error", error: "No speech detected — try again?" });
    return;
  }

  const netState = await NetInfo.fetch();

  if (!netState.isConnected) {
    // Queue for later
    await addToQueue({
      transcript,
      audioUri: audioUri || "",
      duration,
      timestamp: new Date().toISOString(),
    });
    set({
      status: "done",
      result: { items: [], health_entries: [] },
      error: "You're offline. Your note has been saved and will be processed when you're back online.",
    });
    return;
  }

  // ... existing categorize logic
}
```

Add a `processQueue` method:

```ts
processQueue: async (userId) => {
  const queue = await getQueue();
  if (queue.length === 0) return;

  for (const note of queue) {
    set({ transcript: note.transcript, audioUri: note.audioUri, duration: note.duration });
    await get().categorize(userId);
  }
  await clearQueue();
}
```

- [ ] **Step 2: Install NetInfo**

```bash
npx expo install @react-native-community/netinfo
```

- [ ] **Step 3: Process queue on app foreground**

In `app/_layout.tsx`, add an effect to process queued notes when app comes online:

```tsx
import { useRecordingStore } from "../src/stores/recordingStore";
import NetInfo from "@react-native-community/netinfo";

// Inside RootLayout:
useEffect(() => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected && session?.user?.id) {
      useRecordingStore.getState().processQueue(session.user.id);
    }
  });
  return () => unsubscribe();
}, [session]);
```

- [ ] **Step 4: Verify offline queueing**

Turn off wifi/data, record a voice note. Verify it's queued. Turn wifi back on, verify it processes.

- [ ] **Step 5: Commit**

```bash
git add src/stores/recordingStore.ts app/_layout.tsx package.json package-lock.json
git commit -m "feat: add offline queue for voice notes"
```

---

## Task 18: Supabase Realtime Subscription

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Subscribe to realtime changes on items table**

In `app/(tabs)/index.tsx`, add a realtime subscription so the home screen updates when items are created/modified:

```tsx
import { useEffect } from "react";
import { supabase } from "../../src/lib/supabase";

// Inside HomeScreen component, add:
useEffect(() => {
  if (!userId) return;

  const channel = supabase
    .channel("items-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "items", filter: `user_id=eq.${userId}` },
      () => {
        fetchItems(userId);
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "categories", filter: `user_id=eq.${userId}` },
      () => {
        fetchCategories(userId);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [userId]);
```

- [ ] **Step 2: Enable realtime on tables in Supabase**

Go to Supabase Dashboard → Database → Replication → enable realtime on `items` and `categories` tables.

- [ ] **Step 3: Verify realtime updates**

Record a voice note from the Record tab. Switch to Home tab and verify items appear without manual refresh.

- [ ] **Step 4: Commit**

```bash
git add app/\(tabs\)/index.tsx
git commit -m "feat: add realtime subscription for live UI updates"
```

---

## Task 19: Final Integration Test & Polish

**Files:**
- Various minor fixes

- [ ] **Step 1: Run full flow end-to-end**

Test the complete happy path:
1. Sign up with new account
2. Complete onboarding
3. See seed categories on home
4. Record a multi-topic voice note: "I need to buy milk and bread, also I had a salad for lunch, and remind me to call Sarah on Friday"
5. See confirmation card with extracted items
6. Verify items appear in correct categories (Groceries, Health, Reminders/Work)
7. Check off an item
8. View health dashboard — see the lunch entry
9. Open an item, recategorize it
10. Verify nudges appear for low-confidence items

- [ ] **Step 2: Run all tests**

```bash
npx jest --coverage
```

Expected: All tests pass.

- [ ] **Step 3: Fix any issues found during integration testing**

Address any bugs or UX issues discovered.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix: address integration testing issues"
```

- [ ] **Step 5: Create a clean build**

```bash
npx expo prebuild
npx expo run:ios
```

Expected: App builds and runs on iOS simulator without errors.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: Phase 1 MVP complete"
```
