import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { AICategorizationResult } from "../types";
import { parseAIResponse } from "../lib/ai";
import { scheduleReminder } from "../lib/notifications";

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
