import { describe, expect, it } from "vitest";
import { EnvError, parseAiConfig, parsePublicEnv, parseServiceRoleKey } from "@/lib/env";
import { getPlanLimits, PLAN_LIMITS } from "@/config/plans";

describe("parsePublicEnv", () => {
  it("reads and tidies valid values", () => {
    expect(
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co/",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: " key ",
      }),
    ).toEqual({ supabaseUrl: "https://abc.supabase.co", supabaseAnonKey: "key", siteUrl: "http://localhost:3000" });
  });

  it("fails clearly when values are missing or invalid", () => {
    expect(() => parsePublicEnv({})).toThrow(EnvError);
    expect(() => parsePublicEnv({ NEXT_PUBLIC_SUPABASE_URL: "not a url", NEXT_PUBLIC_SUPABASE_ANON_KEY: "k" })).toThrow(
      /must be an http/,
    );
    expect(() => parseServiceRoleKey({ SUPABASE_SERVICE_ROLE_KEY: "  " })).toThrow(EnvError);
  });
});

describe("parseAiConfig", () => {
  it("returns null when AI is not configured, so the app keeps working", () => {
    expect(parseAiConfig({})).toBeNull();
    expect(parseAiConfig({ AI_PROVIDER: "anthropic" })).toBeNull();
  });

  it("rejects unknown providers", () => {
    expect(() => parseAiConfig({ AI_PROVIDER: "mystery", AI_API_KEY: "x" })).toThrow(EnvError);
  });

  it("clamps the timeout to a safe range", () => {
    expect(parseAiConfig({ AI_PROVIDER: "Gemini", AI_API_KEY: "k", AI_TIMEOUT_MS: "999999" })).toEqual({
      provider: "gemini",
      apiKey: "k",
      model: null,
      timeoutMs: 60_000,
    });
    expect(parseAiConfig({ AI_PROVIDER: "openai", AI_API_KEY: "k", AI_TIMEOUT_MS: "abc" })?.timeoutMs).toBe(20_000);
  });
});

describe("plan limits", () => {
  it("falls back to free for unknown plans", () => {
    expect(getPlanLimits("pro")).toBe(PLAN_LIMITS.pro);
    expect(getPlanLimits(null)).toBe(PLAN_LIMITS.free);
    expect(getPlanLimits(undefined)).toBe(PLAN_LIMITS.free);
  });

  it("never offers unlimited AI", () => {
    for (const limits of Object.values(PLAN_LIMITS)) {
      expect(Number.isFinite(limits.aiQuestionsPerDay)).toBe(true);
      expect(limits.aiMaxQuestionsPerRequest).toBeLessThanOrEqual(20);
    }
  });
});

describe("configuration checks", () => {
  it("reports whether Supabase and the service role are configured", async () => {
    const { isSupabaseConfigured, hasServiceRoleKey } = await import("@/lib/env");
    expect(isSupabaseConfigured({})).toBe(false);
    expect(
      isSupabaseConfigured({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "k" }),
    ).toBe(true);
    expect(hasServiceRoleKey({ SUPABASE_SERVICE_ROLE_KEY: " " })).toBe(false);
    expect(hasServiceRoleKey({ SUPABASE_SERVICE_ROLE_KEY: "secret" })).toBe(true);
  });

  it("only allows the test stand-in AI when explicitly enabled", async () => {
    const { parseAiConfig, isAiConfigured } = await import("@/lib/env");
    expect(() => parseAiConfig({ AI_PROVIDER: "mock" })).toThrow();
    expect(parseAiConfig({ AI_PROVIDER: "mock", AI_ALLOW_MOCK: "1" })?.provider).toBe("mock");
    expect(isAiConfigured({})).toBe(false);
    expect(isAiConfigured({ AI_PROVIDER: "mock" })).toBe(false);
    expect(isAiConfigured({ AI_PROVIDER: "anthropic", AI_API_KEY: "k" })).toBe(true);
  });
});
