import { useCategoryStore } from "../../src/stores/categoryStore";
import { SEED_CATEGORIES } from "../../src/constants/seedCategories";

const mockSeedCategories = [
  "Groceries / Shopping",
  "Work Tasks",
  "Personal Tasks",
  "Health & Fitness",
  "Reminders",
  "Ideas / Notes",
  "Inbox",
];

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
          data: mockSeedCategories.map((name, i) => ({
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
