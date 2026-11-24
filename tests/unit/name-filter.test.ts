import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ANYWHERE_TERMS, FILTER_SAMPLES, WORD_TERMS, isAcceptableDisplayName } from "@/domain/name-filter";

describe("isAcceptableDisplayName", () => {
  for (const [name, ok] of FILTER_SAMPLES) {
    it(`${ok ? "allows" : "blocks"} "${name}"`, () => {
      expect(isAcceptableDisplayName(name)).toBe(ok);
    });
  }
});

describe("parity with the database", () => {
  const dir = join(process.cwd(), "supabase/migrations");
  const file = readdirSync(dir).find((f) => f.endsWith("_leaderboards.sql"));
  const sql = readFileSync(join(dir, file!), "utf8");
  const list = (name: string) => {
    const m = sql.match(new RegExp(`${name} constant text\\[\\] := array\\[([^\\]]+)\\]`));
    return [...(m?.[1] ?? "").matchAll(/'([^']+)'/g)].map((x) => x[1]);
  };

  it("uses the same terms", () => {
    expect(list("anywhere")).toEqual([...ANYWHERE_TERMS]);
    expect(list("words")).toEqual([...WORD_TERMS]);
  });

  it("is tested on the same sample names", () => {
    const tests = readFileSync(join(process.cwd(), "tests/db/leaderboards.test.sql"), "utf8");
    for (const [name, ok] of FILTER_SAMPLES) {
      expect(tests).toContain(`('${name}', ${ok})`);
    }
  });
});
