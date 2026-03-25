import { create } from "zustand";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { AICategorizationResult } from "../types";
import { parseAIResponse } from "../lib/ai";
import { scheduleReminder } from "../lib/notifications";

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
  processQueue: (userId: string) => Promise<void>;
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

    // Check connectivity
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
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

      // Schedule reminders for items with reminder_at
      for (const item of data.items || []) {
        if (item.reminder_at) {
          await scheduleReminder(item.title, new Date(item.reminder_at), item.id);
        }
      }

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

  processQueue: async (userId) => {
    const queue = await getQueue();
    if (queue.length === 0) return;

    for (const note of queue) {
      set({
        transcript: note.transcript,
        audioUri: note.audioUri || null,
        duration: note.duration,
      });
      await get().categorize(userId);
    }
    await clearQueue();
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
