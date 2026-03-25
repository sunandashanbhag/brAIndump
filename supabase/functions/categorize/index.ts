import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
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

    // Call Gemini 2.0 Flash
    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2048 },
        }),
      }
    );

    const aiData = await aiResponse.json();
    const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Parse AI response
    let parsed;
    try {
      let cleaned = rawText.trim();
      const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) cleaned = codeBlockMatch[1].trim();
      parsed = JSON.parse(cleaned);
    } catch {
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
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
