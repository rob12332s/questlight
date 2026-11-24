/**
 * Environment parsing. Pure functions over a plain record so they can be unit tested;
 * the server and browser wrappers below read from process.env.
 */

export const AI_PROVIDERS = ["anthropic", "openai", "gemini"] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

export interface PublicEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  siteUrl: string;
}

export interface AiConfig {
  /** "mock" is a deterministic stand-in, only allowed when AI_ALLOW_MOCK=1 (tests). */
  provider: AiProvider | "mock";
  apiKey: string;
  model: string | null;
  timeoutMs: number;
}

export class EnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvError";
  }
}

type Source = Record<string, string | undefined>;

function required(source: Source, key: string): string {
  const value = source[key]?.trim();
  if (!value) throw new EnvError(`Missing environment variable ${key}. See .env.example.`);
  return value;
}

function assertUrl(key: string, value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("bad protocol");
    return value.replace(/\/+$/, "");
  } catch {
    throw new EnvError(`${key} must be an http(s) URL.`);
  }
}

export function parsePublicEnv(source: Source): PublicEnv {
  return {
    supabaseUrl: assertUrl("NEXT_PUBLIC_SUPABASE_URL", required(source, "NEXT_PUBLIC_SUPABASE_URL")),
    supabaseAnonKey: required(source, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    siteUrl: assertUrl("NEXT_PUBLIC_SITE_URL", source.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000"),
  };
}

export function parseServiceRoleKey(source: Source): string {
  return required(source, "SUPABASE_SERVICE_ROLE_KEY");
}

/**
 * Returns null when AI is not configured — callers must treat that as "AI unavailable"
 * and keep the rest of the platform working.
 */
export function parseAiConfig(source: Source): AiConfig | null {
  const provider = source.AI_PROVIDER?.trim().toLowerCase();
  if (provider === "mock") {
    if (source.AI_ALLOW_MOCK !== "1") throw new EnvError("AI_PROVIDER=mock is only for tests (set AI_ALLOW_MOCK=1).");
    return { provider: "mock", apiKey: "mock", model: null, timeoutMs: 5_000 };
  }
  const apiKey = source.AI_API_KEY?.trim();
  if (!provider || !apiKey) return null;
  if (!(AI_PROVIDERS as readonly string[]).includes(provider)) {
    throw new EnvError(`AI_PROVIDER must be one of: ${AI_PROVIDERS.join(", ")}.`);
  }
  const rawTimeout = Number(source.AI_TIMEOUT_MS ?? "20000");
  const timeoutMs = Number.isFinite(rawTimeout) ? Math.min(Math.max(rawTimeout, 3_000), 60_000) : 20_000;
  return {
    provider: provider as AiProvider,
    apiKey,
    model: source.AI_MODEL?.trim() || null,
    timeoutMs,
  };
}

/** True when AI study help can run. A misconfigured provider counts as off. */
export function isAiConfigured(source: Source): boolean {
  try {
    return parseAiConfig(source) !== null;
  } catch {
    return false;
  }
}

/** True when the public Supabase settings are present and valid. */
export function isSupabaseConfigured(source: Source): boolean {
  try {
    parsePublicEnv(source);
    return true;
  } catch {
    return false;
  }
}

/** True when the server-only service-role key is present (needed for account deletion). */
export function hasServiceRoleKey(source: Source): boolean {
  return Boolean(source.SUPABASE_SERVICE_ROLE_KEY?.trim());
}
