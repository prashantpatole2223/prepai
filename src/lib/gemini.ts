import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export class AIError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 502) {
    super(message);
    this.name = "AIError";
    this.statusCode = statusCode;
  }
}

function stripMarkdownFences(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    const firstNewline = cleaned.indexOf("\n");
    if (firstNewline !== -1) {
      cleaned = cleaned.slice(firstNewline + 1);
    }
    const lastFence = cleaned.lastIndexOf("```");
    if (lastFence !== -1) {
      cleaned = cleaned.slice(0, lastFence);
    }
  }
  return cleaned.trim();
}

export async function generateJson<T>(
  prompt: string,
  schema: z.ZodType<T>,
  temperature: number = 0.7
): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AIError("GEMINI_API_KEY is not configured", 500);
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  let lastError: unknown = null;

  // Try original prompt first; retry once with a stricter reminder on failure
  for (let attempt = 1; attempt <= 2; attempt++) {
    const currentPrompt =
      attempt === 1
        ? prompt
        : `${prompt}\n\nIMPORTANT: The previous output failed JSON validation. Return ONLY valid, raw JSON matching the exact requested structure, with no markdown code fences, comments, or extra text.`;

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: currentPrompt,
        config: {
          temperature,
          responseMimeType: "application/json",
        },
      });

      const rawText = response.text || "";
      const cleaned = stripMarkdownFences(rawText);
      const parsedJson = JSON.parse(cleaned);
      const validated = schema.parse(parsedJson);

      return validated;
    } catch (err: unknown) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);

      // Check for rate-limiting (429 or quota exceeded)
      if (
        errMsg.includes("429") ||
        errMsg.toLowerCase().includes("quota") ||
        errMsg.includes("RESOURCE_EXHAUSTED")
      ) {
        throw new AIError("Too many requests, wait a moment", 429);
      }

      console.warn(`[Gemini generateJson] Attempt ${attempt} failed: ${errMsg}`);
    }
  }

  console.error("[Gemini generateJson] All attempts failed:", lastError);
  throw new AIError("AI response failed, please try again", 502);
}
