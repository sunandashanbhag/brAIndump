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
