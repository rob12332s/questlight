import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/redirects";

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/settings?tab=profile")).toBe("/settings?tab=profile");
  });

  it("blocks open redirects", () => {
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "", null, 42]) {
      expect(safeNextPath(bad)).toBe("/dashboard");
    }
  });
});
