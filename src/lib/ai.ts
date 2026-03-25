import { AICategorizationResult, AIExtractedItem, AIExtractedHealthEntry, Category } from "../types";

const EMPTY_RESULT: AICategorizationResult = { items: [], health_entries: [] };

export function parseAIResponse(raw: string): AICategorizationResult {
  try {
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
