import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PLAN_LIMITS } from "@/config/plans";
import {
  buildExplainPrompt,
  buildFlashcardsPrompt,
  buildQuestionsPrompt,
  cleanInput,
  extractJson,
  mockReply,
  parseExplanation,
  parseFlashcards,
  parseQuestions,
} from "@/domain/ai-content";

const ctx = { subject: "Biology", topic: "Cell biology" };

describe("AI prompts", () => {
  it("ground every prompt in the subject and topic, and ask for JSON only", () => {
    for (const p of [buildExplainPrompt(ctx, "What is osmosis?", "simple"), buildQuestionsPrompt(ctx, "standard", 5), buildFlashcardsPrompt(ctx, 8)]) {
      expect(p.user).toContain("Subject: Biology. Topic: Cell biology.");
      expect(p.system).toContain("single JSON object only");
      expect(p.system).toContain("aged 13 to 16");
    }
  });

  it("cleans student input", () => {
    expect(cleanInput("  what\u0000is \n\n osmosis?  ")).toBe("what is osmosis?");
  });
});

describe("parsing AI replies", () => {
  it("extracts JSON, including from a fenced block", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('Sure! {"a":2}')).toEqual({ a: 2 });
    expect(() => extractJson("no json here")).toThrow();
  });

  it("accepts a well-formed explanation and rejects bad ones", () => {
    const good = parseExplanation({ paragraphs: ["One.", "Two."], keyPoints: ["k"], checkQuestion: "What is it?" });
    expect(good.ok).toBe(true);
    expect(parseExplanation({ paragraphs: [] }).ok).toBe(false);
    expect(parseExplanation({ paragraphs: ["<script>x</script>"] }).ok).toBe(false);
    expect(parseExplanation("nope").ok).toBe(false);
  });

  it("keeps only valid, distinct flashcards", () => {
    const { cards, rejected } = parseFlashcards(
      { cards: [{ front: "What is a cell?", back: "The basic unit of life" }, { front: "what is a cell?", back: "dup" }, { front: "", back: "x" }] },
      10,
    );
    expect(cards).toHaveLength(1);
    expect(rejected).toBe(2);
  });

  it("checks AI questions with the same validator as the question bank", () => {
    const bad = { questions: [{ question: "Too short?", options: [], correctOptionId: "E" }] };
    expect(parseQuestions(bad, ctx, "standard", 5)).toHaveLength(0);
  });
});

describe("the test stand-in (AI_PROVIDER=mock)", () => {
  it("produces replies that pass every check", () => {
    const e = parseExplanation(extractJson(mockReply(buildExplainPrompt(ctx, "What is osmosis?", "standard"))));
    expect(e.ok).toBe(true);
    expect(parseQuestions(extractJson(mockReply(buildQuestionsPrompt(ctx, "challenge", 5))), ctx, "challenge", 5)).toHaveLength(5);
    expect(parseFlashcards(extractJson(mockReply(buildFlashcardsPrompt(ctx, 8))), 8).cards).toHaveLength(8);
  });
});

describe("daily limits match the free plan", () => {
  it("uses the same numbers in the database", () => {
    const dir = join(process.cwd(), "supabase/migrations");
    const sql = readFileSync(join(dir, readdirSync(dir).find((f) => f.endsWith("_ai_study.sql"))!), "utf8");
    const limit = (key: string) => Number(sql.match(new RegExp(`'${key}', (\\d+)`))?.[1]);
    expect(limit("questions")).toBe(PLAN_LIMITS.free.aiQuestionsPerDay);
    expect(limit("questions_per_request")).toBe(PLAN_LIMITS.free.aiMaxQuestionsPerRequest);
    expect(limit("flashcards")).toBe(PLAN_LIMITS.free.aiFlashcardRequestsPerDay);
  });
});
