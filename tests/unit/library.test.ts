import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { QUESTION_BANK } from "@/content/bank";
import { courseOptions, LIBRARY_ENTRIES, validateLibrary } from "@/content/library";
import { LESSONS } from "@/content/lessons";
import { validateLesson, markAnswer } from "@/domain/lesson";
import { isMistakeTag } from "@/domain/mistakes";
import { formatProPrice, PLAN_LIMITS, PRO_PRICE } from "@/config/plans";

const SUBJECTS = ["maths", "english-language", "english-literature", "biology", "chemistry", "physics", "history", "geography"];

describe("GCSE library catalogue", () => {
  it("is valid: unique slugs, titles and objectives; real skills, boards and quiz links", () => {
    const quiz = new Set(QUESTION_BANK.map((t) => `${t.subject}/${t.slug}`));
    expect(validateLibrary(LIBRARY_ENTRIES, quiz)).toEqual([]);
  });

  it("has at least 100 entries for every launch subject", () => {
    for (const s of SUBJECTS) expect(LIBRARY_ENTRIES.filter((e) => e.subject === s).length).toBeGreaterThanOrEqual(100);
  });

  it("gives free students a real selection in every subject, but not everything", () => {
    for (const s of SUBJECTS) {
      const entries = LIBRARY_ENTRIES.filter((e) => e.subject === s);
      const free = entries.filter((e) => e.access === "free").length;
      expect(free).toBeGreaterThanOrEqual(10);
      expect(free).toBeLessThan(entries.length / 2);
    }
  });

  it("only claims verified coverage for maths, which shares DfE content across boards", () => {
    const verified = new Set(LIBRARY_ENTRIES.filter((e) => e.verification === "verified").map((e) => e.subject));
    expect([...verified]).toEqual(["maths"]);
  });

  it("offers set texts and history units as course options", () => {
    const lit = courseOptions("english-literature").map((o) => o.key);
    expect(lit).toContain("macbeth");
    expect(lit).toContain("inspector-calls");
    expect(courseOptions("history").every((o) => o.boards.length > 0)).toBe(true);
    expect(courseOptions("maths")).toEqual([]);
  });
});

describe("Exam Answer Coach lessons", () => {
  const all = Object.entries(LESSONS).flatMap(([subject, ls]) => Object.entries(ls).map(([slug, l]) => ({ subject, slug, l })));

  it("covers every launch subject with at least three lessons", () => {
    for (const s of SUBJECTS) expect(Object.keys(LESSONS[s] ?? {}).length).toBeGreaterThanOrEqual(3);
  });

  it("every lesson is valid and attached to a library topic", () => {
    for (const { subject, slug, l } of all) {
      expect(LIBRARY_ENTRIES.some((e) => e.subject === subject && e.slug === slug)).toBe(true);
      expect(validateLesson(JSON.parse(JSON.stringify(l)))).toEqual([]);
    }
  });

  it("every worked step has one right choice, and wrong choices explain why", () => {
    for (const { l } of all) {
      for (const step of l.worked.steps) {
        expect(step.choices.filter((c) => c.correct)).toHaveLength(1);
        for (const c of step.choices.filter((c) => !c.correct)) expect(c.feedback.length).toBeGreaterThan(5);
      }
    }
  });

  it("auto-marked answers accept their own model answer", () => {
    for (const { l } of all) {
      for (const q of [...l.guided, ...l.exam]) {
        const a = q.answer;
        if (a.type === "numeric") expect(markAnswer(a, String(a.value)).status).toBe("correct");
        if (a.type === "text") expect(markAnswer(a, a.accept[0]!).status).toBe("correct");
        if (a.type === "choice") expect(markAnswer(a, a.correct).status).toBe("correct");
      }
    }
  });

  it("uses only known mistake tags", () => {
    for (const { l } of all) for (const m of l.mistakes) expect(isMistakeTag(m.tag)).toBe(true);
  });

  it("includes free lessons in most subjects", () => {
    const free = all.filter(({ subject, slug }) => LIBRARY_ENTRIES.find((e) => e.subject === subject && e.slug === slug)?.access === "free");
    expect(new Set(free.map((f) => f.subject)).size).toBeGreaterThanOrEqual(7);
  });
});

describe("Pro plan configuration", () => {
  const dir = join(process.cwd(), "supabase/migrations");
  const sql = readFileSync(join(dir, readdirSync(dir).find((f) => f.endsWith("_library_coach_pro.sql"))!), "utf8");

  it("formats the price from the single config", () => {
    expect(PRO_PRICE.amountPence).toBe(500);
    expect(formatProPrice()).toBe("£5/month");
  });

  it("free lesson limit matches the database", () => {
    expect(Number(sql.match(/free_lessons_per_day\(\)[\s\S]*?select (\d+);/)?.[1])).toBe(PLAN_LIMITS.free.coachLessonsPerDay);
  });

  it("AI limits for both plans match the database", () => {
    const block = sql.slice(sql.indexOf("create or replace function public.ai_limits()"));
    const [pro, free] = [...block.matchAll(/jsonb_build_object\(([^)]*)\)/g)].slice(0, 2).map((m) => m[1]);
    const n = (s: string, k: string) => Number(s.match(new RegExp(`'${k}', (\\d+)`))?.[1]);
    for (const [s, plan] of [[pro ?? "", PLAN_LIMITS.pro], [free ?? "", PLAN_LIMITS.free]] as const) {
      expect(n(s, "explanation")).toBe(plan.aiExplanationsPerDay);
      expect(n(s, "questions")).toBe(plan.aiQuestionsPerDay);
      expect(n(s, "flashcards")).toBe(plan.aiFlashcardRequestsPerDay);
      expect(n(s, "questions_per_request")).toBe(plan.aiMaxQuestionsPerRequest);
    }
  });

  it("never writes the price anywhere else in the app", () => {
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, f.name);
        if (f.isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(f.name) && !p.endsWith(join("config", "plans.ts"))) files.push(p);
      }
    };
    walk(join(process.cwd(), "src"));
    for (const f of files) expect(readFileSync(f, "utf8")).not.toMatch(/£\s?5(\.00)?\s*(\/|a |per )\s*month|amountPence:\s*500/i);
  });
});
