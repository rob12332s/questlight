import "server-only";

import { mockReply, type Prompt } from "@/domain/ai-content";
import type { AiConfig } from "@/lib/env";

/**
 * Sends one prompt to the configured AI provider and returns its text reply.
 * Server only: the API key never reaches the browser. Uses plain fetch (no SDKs).
 * Set AI_MODEL to choose a model; the defaults are small, low-cost models.
 */
const DEFAULT_MODELS = {
  anthropic: "claude-haiku-5-5",
  openai: "gpt-4o-mini",
  gemini: "gemini-2.0-flash",
} as const;

export class AiProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiProviderError";
  }
}

async function postJson(url: string, headers: Record<string, string>, body: unknown, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new AiProviderError(`provider responded ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err instanceof AiProviderError) throw err;
    throw new AiProviderError(controller.signal.aborted ? "provider timed out" : "provider request failed");
  } finally {
    clearTimeout(timer);
  }
}

function pick(obj: unknown, path: Array<string | number>): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string | number, unknown>)[key];
  }
  return cur;
}

export async function callModel(config: AiConfig, prompt: Prompt): Promise<string> {
  if (config.provider === "mock") return mockReply(prompt);
  const model = config.model ?? DEFAULT_MODELS[config.provider];
  let text: unknown;

  if (config.provider === "anthropic") {
    const data = await postJson(
      "https://api.anthropic.com/v1/messages",
      { "x-api-key": config.apiKey, "anthropic-version": "2023-06-01" },
      { model, max_tokens: prompt.maxTokens, system: prompt.system, messages: [{ role: "user", content: prompt.user }] },
      config.timeoutMs,
    );
    text = pick(data, ["content", 0, "text"]);
  } else if (config.provider === "openai") {
    const data = await postJson(
      "https://api.openai.com/v1/chat/completions",
      { authorization: `Bearer ${config.apiKey}` },
      {
        model,
        max_tokens: prompt.maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
      },
      config.timeoutMs,
    );
    text = pick(data, ["choices", 0, "message", "content"]);
  } else {
    const data = await postJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      { "x-goog-api-key": config.apiKey },
      {
        systemInstruction: { parts: [{ text: prompt.system }] },
        contents: [{ role: "user", parts: [{ text: prompt.user }] }],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: prompt.maxTokens },
      },
      config.timeoutMs,
    );
    text = pick(data, ["candidates", 0, "content", "parts", 0, "text"]);
  }

  if (typeof text !== "string" || !text.trim()) throw new AiProviderError("empty reply");
  return text;
}
