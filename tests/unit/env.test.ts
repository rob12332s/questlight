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
  it("falls back to free for inactive or unknown plans", () => {
    expect(getPlanLimits("student_pro")).toBe(PLAN_LIMITS.free);
    expect(getPlanLimits(null)).toBe(PLAN_LIMITS.free);
  });

  it("never offers unlimited AI", () => {
    for (const limits of Object.values(PLAN_LIMITS)) {
      expect(Number.isFinite(limits.aiQuestionsPerDay)).toBe(true);
      expect(limits.aiMaxQuestionsPerRequest).toBeLessThanOrEqual(20);
    }
  });
});
