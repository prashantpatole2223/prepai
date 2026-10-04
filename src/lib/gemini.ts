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

function getHttpStatus(err: unknown): number | null {
  if (!err) return null;
  if (typeof err === "object") {
    const e = err as Record<string, unknown>;
    if (typeof e.status === "number") return e.status;
    if (typeof e.statusCode === "number") return e.statusCode;
    if (typeof e.code === "number") return e.code;
    if (typeof e.status === "string" && !isNaN(Number(e.status))) return Number(e.status);
    if (e.response && typeof e.response === "object") {
      const resp = e.response as Record<string, unknown>;
      if (typeof resp.status === "number") return resp.status;
      if (typeof resp.statusCode === "number") return resp.statusCode;
    }
  }

  const msg = err instanceof Error ? err.message : String(err);
  const match = msg.match(/\b(400|401|403|404|429|500|502|503|504)\b/);
  if (match) {
    return Number(match[1]);
  }

  if (
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.toLowerCase().includes("quota") ||
    msg.toLowerCase().includes("too many requests")
  ) {
    return 429;
  }

  if (
    msg.includes("UNAVAILABLE") ||
    msg.toLowerCase().includes("service unavailable") ||
    msg.toLowerCase().includes("overloaded")
  ) {
    return 503;
  }

  if (
    msg.includes("INTERNAL") ||
    msg.toLowerCase().includes("internal server error") ||
    msg.toLowerCase().includes("fetch failed") ||
    msg.toLowerCase().includes("network")
  ) {
    return 500;
  }

  return null;
}

const BACKOFF_DELAYS = [1000, 2000, 4000, 6000];

async function callGeminiWithHttpRetry(
  ai: GoogleGenAI,
  prompt: string,
  temperature: number
): Promise<string> {
  const primaryModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL;
  let currentModel = primaryModel;

  const maxRetries = 5;
  const recordedStatuses: number[] = [];
  let lastError: unknown = null;
  let lastStatus: number | null = null;
  let retriesCount = 0;

  while (true) {
    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: prompt,
        config: {
          temperature,
          responseMimeType: "application/json",
        },
      });

      return response.text || "";
    } catch (err: unknown) {
      lastError = err;
      const status = getHttpStatus(err);
      lastStatus = status;
      if (status !== null) {
        recordedStatuses.push(status);
      }

      const errMsg = err instanceof Error ? err.message : String(err);

      // 4. Do not retry on 400, 401, 403 or 404 errors (fail immediately).
      if (status && [400, 401, 403, 404].includes(status)) {
        console.error(`[Gemini generateJson] Fatal client error HTTP ${status}: ${errMsg}`);
        throw new AIError(errMsg, status);
      }

      // 1. Retry up to 5 times on HTTP 503, 500 and 429 errors
      const isRetryable = status !== null && [503, 500, 429].includes(status);
      if (!isRetryable) {
        console.error(`[Gemini generateJson] Non-retryable error: ${errMsg}`);
        throw new AIError(errMsg, status || 500);
      }

      if (retriesCount >= maxRetries) {
        break;
      }

      retriesCount++;

      // 3. Switch to fallback model if primary still fails with 503/429 after 2 retries
      if (
        retriesCount >= 2 &&
        fallbackModel &&
        (status === 503 || status === 429 || currentModel === fallbackModel)
      ) {
        currentModel = fallbackModel;
        console.log(`[Gemini generateJson] Switched to fallback model: ${fallbackModel}`);
      }

      // Exponential backoff (1s, 2s, 4s, 6s) plus small random jitter
      const backoffIndex = Math.min(retriesCount - 1, BACKOFF_DELAYS.length - 1);
      const baseDelay = BACKOFF_DELAYS[backoffIndex];
      const jitter = Math.floor(Math.random() * 300);
      const totalDelay = baseDelay + jitter;

      console.warn(
        `[Gemini generateJson] Attempt failed with HTTP ${status} (retry ${retriesCount}/${maxRetries}) using ${currentModel}. Retrying in ${totalDelay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }
  }

  console.error(`[Gemini generateJson] All ${maxRetries} retries failed:`, lastError);

  // 5. If all attempts fail with 503, throw AIError with specific message
  if (
    recordedStatuses.length > 0 &&
    (recordedStatuses.every((s) => s === 503) || lastStatus === 503)
  ) {
    throw new AIError(
      "The AI service is busy right now, please try again in a few seconds.",
      502
    );
  }

  if (lastStatus === 429) {
    throw new AIError("Too many requests, wait a moment", 429);
  }

  throw new AIError("AI response failed, please try again", 502);
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

  let lastError: unknown = null;

  // 2. Keep the existing retry for JSON parse/zod validation failures (max 1 extra retry)
  for (let attempt = 1; attempt <= 2; attempt++) {
    const currentPrompt =
      attempt === 1
        ? prompt
        : `${prompt}\n\nIMPORTANT: The previous output failed JSON validation. Return ONLY valid, raw JSON matching the exact requested structure, with no markdown code fences, comments, or extra text.`;

    try {
      const rawText = await callGeminiWithHttpRetry(ai, currentPrompt, temperature);
      const cleaned = stripMarkdownFences(rawText);
      const parsedJson = JSON.parse(cleaned);
      const validated = schema.parse(parsedJson);

      return validated;
    } catch (err: unknown) {
      if (err instanceof AIError) {
        throw err;
      }

      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini generateJson] Validation attempt ${attempt} failed: ${errMsg}`);
    }
  }

  console.error("[Gemini generateJson] All validation attempts failed:", lastError);
  throw new AIError("AI response failed, please try again", 502);
}
