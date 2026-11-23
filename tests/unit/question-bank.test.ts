import { describe, expect, it } from "vitest";
import { QUESTION_BANK } from "@/content/bank";
import { normalizeAnswerText } from "@/domain/answers";
import { validateGeneratedQuestion } from "@/domain/question-validation";
import { LAUNCH_SUBJECTS } from "@/config/subjects";

/**
 * Every bank question goes through the same checks as AI-generated content, plus
 * rules for true/false and short-answer questions.
 */
describe("question bank", () => {
  it("covers every launch subject", () => {
    const subjects = new Set(QUESTION_BANK.map((t) => t.subject));
    for (const s of LAUNCH_SUBJECTS) expect(subjects.has(s.slug)).toBe(true);
  });

  it("has unique topic slugs and question keys", () => {
    const topicKeys = QUESTION_BANK.map((t) => `${t.subject}/${t.slug}`);
    expect(new Set(topicKeys).size).toBe(topicKeys.length);
    for (const topic of QUESTION_BANK) {
      const keys = topic.questions.map((q) => q.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("has enough questions at each difficulty for a quiz", () => {
    for (const topic of QUESTION_BANK) {
      expect(topic.questions.length).toBeGreaterThan(5);
      for (const level of ["foundation", "standard", "challenge"] as const) {
        expect(topic.questions.filter((q) => q.difficulty === level).length).toBeGreaterThan(0);
      }
    }
  });

  it("has no duplicate question text anywhere", () => {
    const texts = QUESTION_BANK.flatMap((t) => t.questions.map((q) => normalizeAnswerText(q.q)));
    expect(new Set(texts).size).toBe(texts.length);
  });

  for (const topic of QUESTION_BANK) {
    it(`${topic.subject} / ${topic.name}: every question is well-formed`, () => {
      for (const q of topic.questions) {
        const where = `${topic.slug}/${q.key}`;
        expect(q.q.length).toBeGreaterThan(9);
        expect(q.q.length).toBeLessThanOrEqual(400);
        expect(q.explain.length).toBeGreaterThan(19);
        expect(q.explain.length).toBeLessThanOrEqual(900);

        if (q.type === "mc") {
          const result = validateGeneratedQuestion(
            {
              question: q.q,
              options: q.options.map((text, i) => ({ id: "ABCD"[i], text })),
              correctOptionId: "ABCD"[q.answer],
              correctAnswerText: q.options[q.answer],
              explanation: q.explain,
              topic: topic.name,
              difficulty: q.difficulty,
            },
            { topic: topic.name, difficulty: q.difficulty, count: 1 },
          );
          if (!result.ok) throw new Error(`${where}: ${result.errors.join("; ")}`);
        } else if (q.type === "tf") {
          expect(q.q.toLowerCase().startsWith("true or false")).toBe(true);
        } else {
          expect(q.accept.length).toBeGreaterThan(0);
          for (const a of q.accept) expect(a).toBe(a.toLowerCase().trim());
        }
      }
    });
  }
});
