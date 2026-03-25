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
