import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FEATURES } from "@/config/features";
import { LAUNCH_SUBJECTS } from "@/config/subjects";
import { PRIMARY_NAV } from "@/features/app-shell/nav";

const migrationsDir = join(process.cwd(), "supabase", "migrations");
const sql = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .map((f) => readFileSync(join(migrationsDir, f), "utf8"))
  .join("\n");

describe("public config matches the database", () => {
  it("lists exactly the subjects the migrations seed", () => {
    const block = sql.slice(sql.indexOf("insert into public.subjects"), sql.indexOf("on conflict (slug)"));
    const seeded = [...block.matchAll(/\(\s*'([a-z0-9-]+)'\s*,/g)].map((m) => m[1]);
    expect(seeded).toEqual(LAUNCH_SUBJECTS.map((s) => s.slug));
  });

  it("only links navigation to features that exist in the registry", () => {
    const ids = new Set(FEATURES.map((f) => f.id));
    for (const item of PRIMARY_NAV) {
      if (item.featureId) expect(ids.has(item.featureId)).toBe(true);
    }
  });
});
