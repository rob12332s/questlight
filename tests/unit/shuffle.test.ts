import { describe, expect, it } from "vitest";
import { hashSeed, seededShuffle } from "@/domain/shuffle";

describe("seededShuffle", () => {
  const items = ["A", "B", "C", "D"] as const;

  it("is stable for the same seed and keeps every item", () => {
    const a = seededShuffle(items, "session-1/question-1");
    const b = seededShuffle(items, "session-1/question-1");
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual([...items]);
  });

  it("does not change the input", () => {
    const input = ["A", "B", "C", "D"];
    seededShuffle(input, "x");
    expect(input).toEqual(["A", "B", "C", "D"]);
  });

  it("spreads the first item roughly evenly across positions", () => {
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 4000; i++) {
      const order = seededShuffle(items, `seed-${i}`);
      counts[order.indexOf("A")]! += 1;
    }
    // Each position should get about 1000; allow generous slack.
    for (const c of counts) {
      expect(c).toBeGreaterThan(850);
      expect(c).toBeLessThan(1150);
    }
  });

  it("hashes to unsigned 32-bit integers", () => {
    for (const s of ["", "a", "questlight", "😀"]) {
      const h = hashSeed(s);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(2 ** 32);
    }
  });
});
