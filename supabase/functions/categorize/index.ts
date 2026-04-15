import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("[categorize] Function invoked");
  console.log("[categorize] GEMINI_API_KEY present:", !!GEMINI_API_KEY);
  console.log("[categorize] SUPABASE_URL:", SUPABASE_URL);
  console.log("[categorize] SERVICE_ROLE_KEY present:", !!SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json();
    console.log("[categorize] Request body:", JSON.stringify(body));

    const { transcript, user_id, voice_note_id } = body;

    if (!transcript || !user_id) {
      console.error("[categorize] Missing required fields - transcript:", !!transcript, "user_id:", !!user_id);
      return new Response(JSON.stringify({ error: "Missing transcript or user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[categorize] Creating Supabase client...");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch user's existing categories
    console.log("[categorize] Fetching categories for user:", user_id);
    const { data: categories, error: catFetchError } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at");

    if (catFetchError) {
      console.error("[categorize] Category fetch error:", JSON.stringify(catFetchError));
    }
    console.log("[categorize] Found categories:", (categories || []).length);

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
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    console.log("[categorize] Calling Gemini API...");

    const aiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2048 },
      }),
    });

    console.log("[categorize] Gemini response status:", aiResponse.status);

    const aiData = await aiResponse.json();
    console.log("[categorize] Gemini response body:", JSON.stringify(aiData).slice(0, 500));

    if (!aiResponse.ok) {
      console.error("[categorize] Gemini API error:", JSON.stringify(aiData));
      return new Response(
        JSON.stringify({ error: "AI service error", details: aiData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    console.log("[categorize] Raw AI text:", rawText);

    // Parse AI response
    let parsed;
    try {
      let cleaned = rawText.trim();
      const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) cleaned = codeBlockMatch[1].trim();
      parsed = JSON.parse(cleaned);
      console.log("[categorize] Parsed AI response:", JSON.stringify(parsed));
    } catch (parseError) {
      console.error("[categorize] JSON parse error:", parseError.message, "Raw text was:", rawText);
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
      console.log("[categorize] Processing item:", JSON.stringify(item));

      let category = (categories || []).find(
        (c: any) => c.name.toLowerCase() === item.category_name.toLowerCase() && c.parent_id === null
      );

      if (!category) {
        console.log("[categorize] Creating new category:", item.category_name);
        const { data: newCat, error: catError } = await supabase
          .from("categories")
          .insert({ user_id, name: item.category_name, parent_id: null })
          .select()
          .single();
        if (catError) console.error("[categorize] Category insert error:", JSON.stringify(catError));
        else console.log("[categorize] Category created:", JSON.stringify(newCat));
        category = newCat;
      }

      let categoryId = category?.id;
      if (item.sub_category_name && item.sub_category_name !== "null" && category) {
        let subCat = (categories || []).find(
          (c: any) =>
            c.name.toLowerCase() === item.sub_category_name.toLowerCase() &&
            c.parent_id === category!.id
        );
        if (!subCat) {
          console.log("[categorize] Creating sub-category:", item.sub_category_name);
          const { data: newSub, error: subError } = await supabase
            .from("categories")
            .insert({
              user_id,
              name: item.sub_category_name,
              parent_id: category.id,
            })
            .select()
            .single();
          if (subError) console.error("[categorize] Sub-category insert error:", JSON.stringify(subError));
          subCat = newSub;
        }
        if (subCat) categoryId = subCat.id;
      }

      console.log("[categorize] Inserting item with category_id:", categoryId);
      const { data: newItem, error: itemError } = await supabase
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

      if (itemError) {
        console.error("[categorize] Item insert error:", JSON.stringify(itemError));
      } else {
        console.log("[categorize] Item created:", JSON.stringify(newItem));
      }

      if (newItem) {
        createdItems.push(newItem);

        if (voice_note_id) {
          const { error: linkError } = await supabase.from("voice_note_items").insert({
            voice_note_id,
            item_id: newItem.id,
          });
          if (linkError) console.error("[categorize] Voice note link error:", JSON.stringify(linkError));
        }
      }
    }

    // Process health entries
    for (const entry of parsed.health_entries || []) {
      console.log("[categorize] Inserting health entry:", JSON.stringify(entry));
      const { error: healthError } = await supabase.from("health_entries").insert({
        user_id,
        type: entry.type,
        details: entry.details,
      });
      if (healthError) console.error("[categorize] Health entry insert error:", JSON.stringify(healthError));
    }

    const result = {
      items: createdItems,
      health_entries_count: (parsed.health_entries || []).length,
    };
    console.log("[categorize] Success! Returning:", JSON.stringify(result));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[categorize] Unhandled error:", error.message);
    console.error("[categorize] Stack:", error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
