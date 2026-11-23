import { describe, expect, it } from "vitest";
import { validateGeneratedBatch, validateGeneratedQuestion } from "@/domain/question-validation";

const request = { topic: "Photosynthesis", difficulty: "standard" as const, count: 3 };

function goodQuestion(overrides: Record<string, unknown> = {}) {
  return {
    question: "Which gas do plants take in from the air for photosynthesis?",
    options: [
      { id: "A", text: "Oxygen" },
      { id: "B", text: "Carbon dioxide" },
      { id: "C", text: "Nitrogen" },
      { id: "D", text: "Hydrogen" },
    ],
    correctOptionId: "B",
    correctAnswerText: "Carbon dioxide",
    explanation: "Plants absorb carbon dioxide through their stomata and use it to make glucose.",
    wrongOptionNotes: { A: "Oxygen is released as a by-product, not taken in for photosynthesis." },
    topic: "Photosynthesis",
    difficulty: "standard",
    ...overrides,
  };
}

function errorsFor(raw: unknown) {
  const result = validateGeneratedQuestion(raw, request);
  return result.ok ? [] : result.errors;
}

describe("validateGeneratedQuestion", () => {
  it("accepts a well-formed question", () => {
    const result = validateGeneratedQuestion(goodQuestion(), request);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.question.correctOptionId).toBe("B");
      expect(result.question.wrongOptionNotes).toEqual({
        A: "Oxygen is released as a by-product, not taken in for photosynthesis.",
      });
    }
  });

  it("accepts lower-case ids and trims whitespace", () => {
    const result = validateGeneratedQuestion(goodQuestion({ correctOptionId: " b ", question: "  Which gas do plants   take in for photosynthesis?  " }), request);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.question.text).toBe("Which gas do plants take in for photosynthesis?");
  });

  it("rejects non-objects", () => {
    expect(errorsFor(null)).toEqual(["question is not an object"]);
    expect(errorsFor("text")).toEqual(["question is not an object"]);
  });

  it("requires exactly four options in A–D order", () => {
    expect(errorsFor(goodQuestion({ options: [{ id: "A", text: "x" }] }))).toContain("expected exactly 4 options");
    const swapped = goodQuestion();
    swapped.options = [swapped.options[1]!, swapped.options[0]!, swapped.options[2]!, swapped.options[3]!];
    expect(errorsFor(swapped)).toContain("option 1 must have id A");
  });

  it("rejects duplicate options, even with different case/punctuation", () => {
    const dup = goodQuestion();
    dup.options[3] = { id: "D", text: "carbon dioxide." };
    expect(errorsFor(dup)).toContain("answer options are not distinct");
  });

  it("treats apostrophes as meaningful when comparing options", () => {
    const q = goodQuestion();
    q.options = [
      { id: "A", text: "The dog wagged it's tail." },
      { id: "B", text: "The dog wagged its tail." },
      { id: "C", text: "The dog's wagged it's tail." },
      { id: "D", text: "The dogs wagged it's tails." },
    ];
    expect(errorsFor(q)).not.toContain("answer options are not distinct");
  });

  it("rejects 'all of the above' style answers", () => {
    const bad = goodQuestion();
    bad.options[3] = { id: "D", text: "All of the above" };
    expect(errorsFor(bad).some((e) => e.includes("all of the above"))).toBe(true);
  });

  it("catches an answer index that points at the wrong option", () => {
    expect(errorsFor(goodQuestion({ correctOptionId: "A" }))).toContain(
      "correctAnswerText does not match the option marked correct",
    );
  });

  it("rejects an unknown correct option", () => {
    expect(errorsFor(goodQuestion({ correctOptionId: "E" }))).toContain("correctOptionId must be one of A, B, C, D");
  });

  it("rejects missing or too-short explanations", () => {
    expect(errorsFor(goodQuestion({ explanation: undefined }))).toContain("missing explanation");
    expect(errorsFor(goodQuestion({ explanation: "Because." }))).toContain("explanation length out of range");
  });

  it("rejects notes that describe the correct option as wrong", () => {
    expect(errorsFor(goodQuestion({ wrongOptionNotes: { B: "This is wrong because..." } }))).toContain(
      "wrongOptionNotes includes the correct option",
    );
  });

  it("rejects topic or difficulty drift", () => {
    expect(errorsFor(goodQuestion({ topic: "Respiration" }))).toContain("topic does not match the request");
    expect(errorsFor(goodQuestion({ difficulty: "challenge" }))).toContain("difficulty does not match the request");
    expect(errorsFor(goodQuestion({ difficulty: "impossible" }))).toContain("difficulty does not match the request");
  });

  it("accepts the topic echoed with different case", () => {
    expect(validateGeneratedQuestion(goodQuestion({ topic: "photosynthesis" }), request).ok).toBe(true);
  });
});

describe("validateGeneratedBatch", () => {
  it("keeps valid questions and reports rejected ones by index", () => {
    const result = validateGeneratedBatch(
      { questions: [goodQuestion(), goodQuestion({ correctOptionId: "Z" }), goodQuestion({ question: "What do plants release as a by-product of photosynthesis?", correctOptionId: "A", correctAnswerText: "Oxygen", wrongOptionNotes: {} })] },
      request,
    );
    expect(result.valid).toHaveLength(2);
    expect(result.rejected.map((r) => r.index)).toEqual([1]);
  });

  it("rejects duplicate questions within a batch", () => {
    const result = validateGeneratedBatch({ questions: [goodQuestion(), goodQuestion()] }, request);
    expect(result.valid).toHaveLength(1);
    expect(result.rejected[0]?.errors).toEqual(["duplicate question in batch"]);
  });

  it("ignores extra questions beyond the requested count", () => {
    const qs = ["Alpha", "Bravo", "Charlie", "Delta"].map((w) => goodQuestion({ question: `${w}: which gas do plants absorb?` }));
    const result = validateGeneratedBatch({ questions: qs }, request);
    expect(result.valid).toHaveLength(3);
    expect(result.rejected.at(-1)?.errors[0]).toMatch(/extra questions ignored/);
  });

  it("rejects malformed responses entirely", () => {
    expect(validateGeneratedBatch([goodQuestion()], request).valid).toHaveLength(0);
    expect(validateGeneratedBatch({ items: [] }, request).rejected[0]?.index).toBe(-1);
  });
});
