import { describe, expect, it } from "vitest";
import { APPEARANCE_SCRIPT, DEFAULT_APPEARANCE, resolveTheme, sanitizeAppearance } from "@/lib/appearance";

describe("appearance preferences", () => {
  it("falls back to defaults for missing or unknown values", () => {
    expect(sanitizeAppearance(null)).toEqual(DEFAULT_APPEARANCE);
    expect(sanitizeAppearance({ theme: "neon", accent: 42, extra: "x" })).toEqual(DEFAULT_APPEARANCE);
  });

  it("keeps allowed values", () => {
    const a = sanitizeAppearance({ theme: "light", accent: "teal", text: "larger", font: "readable", spacing: "relaxed", motion: "reduced" });
    expect(a).toEqual({ theme: "light", accent: "teal", text: "larger", font: "readable", spacing: "relaxed", motion: "reduced" });
  });

  it("resolves 'match device' from the system preference", () => {
    expect(resolveTheme("system", true)).toBe("light");
    expect(resolveTheme("system", false)).toBe("dark");
    expect(resolveTheme("dark", true)).toBe("dark");
  });

  it("produces a self-contained head script that applies the same rules", () => {
    const attrs: Record<string, string> = {};
    const fakeWindow = {
      localStorage: { getItem: () => JSON.stringify({ theme: "system", accent: "rose", text: "bogus" }) },
      matchMedia: () => ({ matches: true }),
      document: { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } },
    };
    const run = new Function("localStorage", "matchMedia", "document", APPEARANCE_SCRIPT);
    run(fakeWindow.localStorage, fakeWindow.matchMedia, fakeWindow.document);
    expect(attrs).toEqual({
      "data-theme": "light",
      "data-accent": "rose",
      "data-text": "standard",
      "data-font": "standard",
      "data-spacing": "standard",
      "data-motion": "full",
    });
  });
});
