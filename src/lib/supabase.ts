import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

let SecureStore: any = null;
try {
  SecureStore = require("expo-secure-store");
} catch {
  // Not available — will fall back to AsyncStorage
}

const StorageAdapter = {
  getItem: (key: string) => {
    if (SecureStore) return SecureStore.getItemAsync(key);
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (SecureStore) return SecureStore.setItemAsync(key, value);
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (SecureStore) return SecureStore.deleteItemAsync(key);
    return AsyncStorage.removeItem(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: StorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
