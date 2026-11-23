import { isOptionId, type AnswerOption, type OptionId } from "./types";

export type AnswerEvaluation =
  | { status: "correct"; submitted: OptionId; correct: OptionId }
  | { status: "incorrect"; submitted: OptionId; correct: OptionId }
  | { status: "invalid"; reason: "unknown_option" | "malformed" };

/**
 * Evaluates a multiple-choice submission. Runs on the server only (the database does the
 * authoritative check during play); the client never receives `correct` before submitting.
 */
export function evaluateMultipleChoice(
  options: readonly AnswerOption[],
  correct: OptionId,
  submitted: unknown,
): AnswerEvaluation {
  if (typeof submitted !== "string") return { status: "invalid", reason: "malformed" };
  const normalized = submitted.trim().toUpperCase();
  if (!isOptionId(normalized)) return { status: "invalid", reason: "malformed" };
  if (!options.some((option) => option.id === normalized)) return { status: "invalid", reason: "unknown_option" };
  return normalized === correct
    ? { status: "correct", submitted: normalized, correct }
    : { status: "incorrect", submitted: normalized, correct };
}

/**
 * Normalises free text for comparisons such as "are these two options really the same?"
 * Case, accents, quote marks, trailing sentence punctuation and repeated whitespace are ignored.
 */
export function normalizeAnswerText(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[“”"'‘’`]/g, "")
    .replace(/\s+/g, " ")
    // Only trailing sentence punctuation is dropped. Leading "-" or ".", brackets, "!" and "?"
    // carry meaning in maths answers ("-5" vs "5", "5!" vs "5"), so they are kept.
    .replace(/[\s.,;:]+$/, "")
    .trim();
}
