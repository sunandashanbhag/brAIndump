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
