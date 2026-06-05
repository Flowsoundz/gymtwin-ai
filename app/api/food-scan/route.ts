import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

type DetectedItem = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: string;
  confidence: number;
};

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a professional sports nutritionist and food recognition expert.
Analyze the food image and identify every distinct food item visible.

Return ONLY a valid JSON array — no explanation, no markdown, no extra text.
Each element must have exactly these keys:
  name        string  — common English food name (e.g. "Grilled Chicken Breast")
  calories    number  — kcal for the visible portion
  protein     number  — grams of protein
  carbs       number  — grams of carbohydrates
  fats        number  — grams of fat
  servingSize string  — human-readable portion (e.g. "1 cup", "100g", "1 medium")
  confidence  number  — integer 50–98: your certainty this identification is correct

Rules:
- Maximum 3 items
- If no food is clearly visible, return []
- Round all macro numbers to the nearest integer
- Base estimates on standard USDA / nutritional-database values for that portion size`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 });
  }

  let imageBase64: string;
  try {
    const body = await req.json() as { imageBase64?: string };
    if (!body.imageBase64 || typeof body.imageBase64 !== "string") {
      return NextResponse.json({ error: "imageBase64 required" }, { status: 400 });
    }
    // Strip data URL prefix if present
    imageBase64 = body.imageBase64.replace(/^data:image\/\w+;base64,/, "");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageBase64,
              },
            },
            { type: "text", text: "Identify the food items in this image." },
          ],
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "[]";

    // Extract JSON array even if the model wraps it in a code block
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ items: [] });
    }

    const items = JSON.parse(jsonMatch[0]) as DetectedItem[];
    const validated = items
      .filter((i) => i && typeof i.name === "string" && typeof i.calories === "number")
      .slice(0, 3);

    return NextResponse.json({ items: validated });
  } catch (err) {
    console.error("[food-scan]", err);
    return NextResponse.json({ error: "Detection failed" }, { status: 500 });
  }
}
