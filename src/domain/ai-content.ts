/**
 * Prompts for the AI study helper, and strict parsing of what comes back.
 *
 * The model is asked for JSON only. Everything it returns is checked here: wrong shapes,
 * empty or over-long text, duplicates and anything that looks like markup are rejected,
 * never "fixed up". Nothing from the model is rendered as HTML.
 */
import type { Difficulty } from "./types";
import { validateGeneratedBatch, type ValidatedQuestion } from "./question-validation";

export const EXPLAIN_LEVELS = ["simple", "standard", "detailed"] as const;
export type ExplainLevel = (typeof EXPLAIN_LEVELS)[number];

export const AI_INPUT_LIMITS = { questionMax: 300, questionMin: 5 } as const;

export interface TopicContext {
  subject: string;
  topic: string;
}

export interface Prompt {
  system: string;
  user: string;
  maxTokens: number;
}

const SAFETY = [
  "You are Questlight's revision helper for UK secondary school students aged 13 to 16 studying for GCSEs.",
  "Stay on the school subject given. Use British English and age-appropriate language.",
  "If a request is not about the subject, is unsafe, or asks for personal information, politely decline in the requested JSON format and suggest asking a teacher.",
  "Never ask for or repeat personal details. Do not include links, HTML or markdown.",
  "Be accurate. If you are not sure, say so rather than guessing.",
  "Reply with a single JSON object only, with no text before or after it.",
].join(" ");

const LEVEL_GUIDE: Record<ExplainLevel, string> = {
  simple: "Explain it simply, as if to a student meeting the idea for the first time, in 2 short paragraphs.",
  standard: "Explain it at GCSE level in 2 to 3 short paragraphs, using the correct key terms.",
  detailed: "Explain it in depth for a student aiming for top grades, in 3 to 4 paragraphs, with an example.",
};

/** Removes control characters and squeezes whitespace in student input. */
export function cleanInput(text: string): string {
  return text
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildExplainPrompt(ctx: TopicContext, question: string, level: ExplainLevel): Prompt {
  return {
    system: SAFETY,
    user: [
      `Subject: ${ctx.subject}. Topic: ${ctx.topic}.`,
      `A student asks: """${cleanInput(question)}"""`,
      LEVEL_GUIDE[level],
      'Return JSON: {"paragraphs": string[], "keyPoints": string[] (2 to 4 short bullet points), "checkQuestion": string (one short question the student can use to test themselves)}.',
    ].join("\n"),
    maxTokens: level === "detailed" ? 1200 : 800,
  };
}

export function buildQuestionsPrompt(ctx: TopicContext, difficulty: Difficulty, count: number): Prompt {
  return {
    system: SAFETY,
    user: [
      `Subject: ${ctx.subject}. Topic: ${ctx.topic}. Difficulty: ${difficulty} (foundation, standard or challenge, GCSE level).`,
      `Write ${count} original multiple-choice questions on this topic. Each has exactly 4 options, one correct.`,
      "Options must be distinct and plausible. Never use 'all of the above' or 'none of the above'.",
      'Return JSON: {"questions": [{"question": string, "options": [{"id": "A"|"B"|"C"|"D", "text": string}], "correctOptionId": "A"|"B"|"C"|"D", "correctAnswerText": string (the text of the correct option), "explanation": string (why it is right, 1 to 3 sentences), "topic": string, "difficulty": string}]}.',
      `Use "${ctx.topic}" as the topic and "${difficulty}" as the difficulty in every question.`,
    ].join("\n"),
    maxTokens: 400 + count * 260,
  };
}

export function buildFlashcardsPrompt(ctx: TopicContext, count: number): Prompt {
  return {
    system: SAFETY,
    user: [
      `Subject: ${ctx.subject}. Topic: ${ctx.topic}.`,
      `Write ${count} revision flashcards covering the most important facts and definitions for this GCSE topic.`,
      "Each front is a short question or prompt; each back is a concise, correct answer.",
      'Return JSON: {"cards": [{"front": string (under 150 characters), "back": string (under 300 characters)}]}.',
    ].join("\n"),
    maxTokens: 300 + count * 120,
  };
}

/** Pulls the JSON object out of a model reply (tolerating a ```json fence). */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const body = fenced ? fenced[1]! : trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("no JSON object in the reply");
  return JSON.parse(body.slice(start, end + 1));
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Plain text only: no tags, no control characters, sensible length. */
function cleanText(v: unknown, min: number, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = cleanInput(v);
  if (t.length < min || t.length > max) return null;
  if (/<\/?[a-z][^>]*>/i.test(t)) return null;
  return t;
}

export interface Explanation {
  paragraphs: string[];
  keyPoints: string[];
  checkQuestion: string | null;
}

export function parseExplanation(raw: unknown): { ok: true; value: Explanation } | { ok: false; error: string } {
  if (!isRecord(raw) || !Array.isArray(raw.paragraphs)) return { ok: false, error: "missing paragraphs" };
  const paragraphs = raw.paragraphs.map((p) => cleanText(p, 1, 1200));
  if (paragraphs.length === 0 || paragraphs.length > 6 || paragraphs.some((p) => p === null)) {
    return { ok: false, error: "paragraphs must be 1 to 6 non-empty strings" };
  }
  const points = Array.isArray(raw.keyPoints) ? raw.keyPoints.map((p) => cleanText(p, 1, 240)) : [];
  if (points.some((p) => p === null) || points.length > 6) return { ok: false, error: "bad key points" };
  const check = raw.checkQuestion === undefined || raw.checkQuestion === null ? null : cleanText(raw.checkQuestion, 5, 300);
  return {
    ok: true,
    value: { paragraphs: paragraphs as string[], keyPoints: points as string[], checkQuestion: check },
  };
}

export interface Flashcard {
  front: string;
  back: string;
}

export function parseFlashcards(raw: unknown, count: number): { cards: Flashcard[]; rejected: number } {
  if (!isRecord(raw) || !Array.isArray(raw.cards)) return { cards: [], rejected: 0 };
  const seen = new Set<string>();
  const cards: Flashcard[] = [];
  let rejected = 0;
  for (const item of raw.cards.slice(0, count)) {
    const front = isRecord(item) ? cleanText(item.front, 3, 300) : null;
    const back = isRecord(item) ? cleanText(item.back, 1, 600) : null;
    const key = front?.toLowerCase();
    if (!front || !back || !key || seen.has(key)) {
      rejected += 1;
      continue;
    }
    seen.add(key);
    cards.push({ front, back });
  }
  return { cards, rejected };
}

export function parseQuestions(raw: unknown, ctx: TopicContext, difficulty: Difficulty, count: number): ValidatedQuestion[] {
  return validateGeneratedBatch(raw, { topic: ctx.topic, difficulty, count }).valid;
}

/**
 * Deterministic replies used when AI_PROVIDER=mock (tests only). They follow the same
 * JSON shapes as real replies and go through the same parsing.
 */
export function mockReply(prompt: Prompt): string {
  const topic = prompt.user.match(/Topic: ([^.\n]+)\./)?.[1] ?? "this topic";
  if (prompt.user.includes('"paragraphs"')) {
    return JSON.stringify({
      paragraphs: [`Here is a short explanation about ${topic}.`, "This answer was written by the test helper."],
      keyPoints: ["First key point", "Second key point"],
      checkQuestion: `What is one key idea in ${topic}?`,
    });
  }
  if (prompt.user.includes('"questions"')) {
    const difficulty = prompt.user.match(/Difficulty: (foundation|standard|challenge)/)?.[1] ?? "standard";
    const count = Number(prompt.user.match(/Write (\d+) original/)?.[1] ?? "3");
    return JSON.stringify({
      questions: Array.from({ length: count }, (_, i) => ({
        question: `Practice question ${i + 1} about ${topic}: which option is correct?`,
        options: [
          { id: "A", text: `Correct answer ${i + 1}` },
          { id: "B", text: `Wrong answer ${i + 1}a` },
          { id: "C", text: `Wrong answer ${i + 1}b` },
          { id: "D", text: `Wrong answer ${i + 1}c` },
        ],
        correctOptionId: "A",
        correctAnswerText: `Correct answer ${i + 1}`,
        explanation: "This explanation comes from the test helper and is long enough.",
        topic,
        difficulty,
      })),
    });
  }
  const count = Number(prompt.user.match(/Write (\d+) revision/)?.[1] ?? "5");
  return JSON.stringify({
    cards: Array.from({ length: count }, (_, i) => ({ front: `Test card ${i + 1} on ${topic}`, back: `Answer ${i + 1}` })),
  });
}
