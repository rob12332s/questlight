import { describe, expect, it } from "vitest";
import { evaluateMultipleChoice, normalizeAnswerText } from "@/domain/answers";
import type { AnswerOption } from "@/domain/types";

const options: AnswerOption[] = [
  { id: "A", text: "Oxygen" },
  { id: "B", text: "Carbon dioxide" },
  { id: "C", text: "Nitrogen" },
  { id: "D", text: "Hydrogen" },
];

describe("evaluateMultipleChoice", () => {
  it("marks the correct option", () => {
    expect(evaluateMultipleChoice(options, "B", "B")).toEqual({ status: "correct", submitted: "B", correct: "B" });
  });

  it("marks a wrong option", () => {
    expect(evaluateMultipleChoice(options, "B", "a")).toEqual({ status: "incorrect", submitted: "A", correct: "B" });
  });

  it("rejects malformed and unknown submissions", () => {
    expect(evaluateMultipleChoice(options, "B", 2)).toEqual({ status: "invalid", reason: "malformed" });
    expect(evaluateMultipleChoice(options, "B", "E")).toEqual({ status: "invalid", reason: "malformed" });
    expect(evaluateMultipleChoice(options.slice(0, 2), "B", "D")).toEqual({ status: "invalid", reason: "unknown_option" });
  });
});

describe("normalizeAnswerText", () => {
  it("ignores case, accents, quotes, whitespace and trailing full stops", () => {
    expect(normalizeAnswerText('  "Café   au LAIT." ')).toBe("cafe au lait");
  });

  it("keeps punctuation that changes a maths answer", () => {
    expect(normalizeAnswerText("3.14")).toBe("3.14");
    expect(normalizeAnswerText("-5")).not.toBe(normalizeAnswerText("5"));
    expect(normalizeAnswerText("5!")).not.toBe(normalizeAnswerText("5"));
    expect(normalizeAnswerText(".5")).toBe(".5");
    expect(normalizeAnswerText("(x + 1)")).toBe("(x + 1)");
  });
});
