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
