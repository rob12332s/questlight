import { normalizeAnswerText } from "./answers";
import {
  OPTION_IDS,
  isDifficulty,
  isOptionId,
  type AnswerOption,
  type Difficulty,
  type OptionId,
} from "./types";

/**
 * Validation for multiple-choice questions produced by an AI model (and reused for
 * teacher-authored questions later). Structural checks reject malformed output; semantic
 * checks catch the mistakes models actually make — duplicated options, an answer index
 * that points at the wrong option, "all of the above", or drifting off the requested
 * topic/difficulty. Anything that fails is dropped, never "repaired" silently.
 */

export const QUESTION_LIMITS = {
  questionMin: 10,
  questionMax: 400,
  optionMax: 160,
  explanationMin: 20,
  explanationMax: 900,
  noteMax: 300,
} as const;

export interface GenerationRequest {
  /** The topic name the student asked for, e.g. "Photosynthesis". */
  topic: string;
  difficulty: Difficulty;
  count: number;
}

export interface ValidatedQuestion {
  text: string;
  options: AnswerOption[];
  correctOptionId: OptionId;
  explanation: string;
  wrongOptionNotes: Partial<Record<OptionId, string>>;
  topic: string;
  difficulty: Difficulty;
}

export type QuestionValidation = { ok: true; question: ValidatedQuestion } | { ok: false; errors: string[] };

const BANNED_OPTION_PATTERNS = [
  /^all of (the )?(above|these)$/,
  /^none of (the )?(above|these)$/,
  /^both [a-d] and [a-d]$/,
  /^[a-d] and [a-d]$/,
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown): string | null {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : null;
}

export function validateGeneratedQuestion(raw: unknown, request: GenerationRequest): QuestionValidation {
  const errors: string[] = [];
  if (!isRecord(raw)) return { ok: false, errors: ["question is not an object"] };

  const text = cleanString(raw.question);
  if (!text) errors.push("missing question text");
  else if (text.length < QUESTION_LIMITS.questionMin || text.length > QUESTION_LIMITS.questionMax)
    errors.push("question text length out of range");

  // Options: exactly A–D, in order, non-empty, distinct.
  const options: AnswerOption[] = [];
  if (!Array.isArray(raw.options) || raw.options.length !== OPTION_IDS.length) {
    errors.push(`expected exactly ${OPTION_IDS.length} options`);
  } else {
    raw.options.forEach((option, index) => {
      const expectedId = OPTION_IDS[index];
      if (!isRecord(option) || !expectedId) {
        errors.push(`option ${index + 1} is malformed`);
        return;
      }
      const id = cleanString(option.id)?.toUpperCase();
      const optionText = cleanString(option.text);
      if (id !== expectedId) errors.push(`option ${index + 1} must have id ${expectedId}`);
      if (!optionText) errors.push(`option ${expectedId} is empty`);
      else if (optionText.length > QUESTION_LIMITS.optionMax) errors.push(`option ${expectedId} is too long`);
      else {
        const normalized = normalizeAnswerText(optionText);
        if (BANNED_OPTION_PATTERNS.some((pattern) => pattern.test(normalized)))
          errors.push(`option ${expectedId} uses a combined/"all of the above" answer`);
        options.push({ id: expectedId, text: optionText });
      }
    });
    const normalizedTexts = options.map((option) => normalizeAnswerText(option.text));
    if (new Set(normalizedTexts).size !== normalizedTexts.length) errors.push("answer options are not distinct");
  }

  // Correct answer: must exist, and the restated text must match that option exactly.
  const correctRaw = cleanString(raw.correctOptionId)?.toUpperCase();
  const correctOptionId = isOptionId(correctRaw) ? correctRaw : null;
  if (!correctOptionId) errors.push("correctOptionId must be one of A, B, C, D");
  const restated = cleanString(raw.correctAnswerText);
  const correctOption = options.find((option) => option.id === correctOptionId);
  if (!restated) errors.push("missing correctAnswerText");
  else if (correctOption && normalizeAnswerText(restated) !== normalizeAnswerText(correctOption.text))
    errors.push("correctAnswerText does not match the option marked correct");

  const explanation = cleanString(raw.explanation);
  if (!explanation) errors.push("missing explanation");
  else if (
    explanation.length < QUESTION_LIMITS.explanationMin ||
    explanation.length > QUESTION_LIMITS.explanationMax
  )
    errors.push("explanation length out of range");

  const wrongOptionNotes: Partial<Record<OptionId, string>> = {};
  if (raw.wrongOptionNotes !== undefined && raw.wrongOptionNotes !== null) {
    if (!isRecord(raw.wrongOptionNotes)) errors.push("wrongOptionNotes must be an object");
    else
      for (const [key, value] of Object.entries(raw.wrongOptionNotes)) {
        const id = key.toUpperCase();
        const note = cleanString(value);
        if (!isOptionId(id) || !note) continue;
        if (id === correctOptionId) {
          errors.push("wrongOptionNotes includes the correct option");
          continue;
        }
        wrongOptionNotes[id] = note.slice(0, QUESTION_LIMITS.noteMax);
      }
  }

  // The model must echo what it was asked for. This cannot prove relevance, but it
  // catches batches where the model silently switched topic or difficulty.
  const topic = cleanString(raw.topic);
  if (!topic || normalizeAnswerText(topic) !== normalizeAnswerText(request.topic))
    errors.push("topic does not match the request");
  if (!isDifficulty(raw.difficulty) || raw.difficulty !== request.difficulty)
    errors.push("difficulty does not match the request");

  if (errors.length > 0 || !text || !correctOptionId || !explanation || !topic) return { ok: false, errors };

  return {
    ok: true,
    question: {
      text,
      options,
      correctOptionId,
      explanation,
      wrongOptionNotes,
      topic: request.topic,
      difficulty: request.difficulty,
    },
  };
}

export interface BatchValidation {
  valid: ValidatedQuestion[];
  rejected: Array<{ index: number; errors: string[] }>;
}

/** Validates a whole model response: `{ "questions": [...] }`. Duplicate questions are rejected. */
export function validateGeneratedBatch(raw: unknown, request: GenerationRequest): BatchValidation {
  if (!isRecord(raw) || !Array.isArray(raw.questions)) {
    return { valid: [], rejected: [{ index: -1, errors: ["response must be an object with a questions array"] }] };
  }
  const valid: ValidatedQuestion[] = [];
  const rejected: BatchValidation["rejected"] = [];
  const seen = new Set<string>();

  raw.questions.slice(0, Math.max(0, request.count)).forEach((item, index) => {
    const result = validateGeneratedQuestion(item, request);
    if (!result.ok) {
      rejected.push({ index, errors: result.errors });
      return;
    }
    const key = normalizeAnswerText(result.question.text);
    if (seen.has(key)) {
      rejected.push({ index, errors: ["duplicate question in batch"] });
      return;
    }
    seen.add(key);
    valid.push(result.question);
  });
  if (raw.questions.length > request.count) {
    rejected.push({ index: request.count, errors: [`${raw.questions.length - request.count} extra questions ignored`] });
  }
  return { valid, rejected };
}
