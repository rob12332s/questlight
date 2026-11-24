/**
 * Exam Answer Coach lesson format, validation and marking.
 *
 * A lesson teaches one library topic in stages. The coach never reveals a full worked
 * solution up front: the worked example asks the student to choose each next step and
 * explains why each choice is right or wrong. Guided questions give hints one at a time.
 * Exam-style questions are marked automatically where the answer is exact (a number, a
 * choice, a short phrase); extended answers are self-checked against the mark scheme.
 */
import { isMistakeTag, type MistakeTagId } from "./mistakes";

export type LessonStyle = "calculation" | "analysis" | "explanation" | "evaluation";

export type Answer =
  | { type: "numeric"; value: number; tolerance?: number; unit?: string }
  | { type: "choice"; options: string[]; correct: number }
  | { type: "text"; accept: string[] }
  | { type: "extended" };

export interface StepChoice {
  text: string;
  correct: boolean;
  feedback: string;
  tag?: MistakeTagId;
}

export interface WorkedStep {
  /** What the student should decide at this step. */
  prompt: string;
  choices: StepChoice[];
  /** Shown after the step is answered correctly: the working so far. */
  reveal: string;
}

export interface MarkPoint {
  point: string;
  marks: number;
}

export interface GuidedQuestion {
  question: string;
  marks: number;
  answer: Answer;
  hints: string[];
  solution: string;
}

export interface ExamQuestion {
  question: string;
  marks: number;
  answer: Answer;
  markScheme: MarkPoint[];
  modelAnswer: string;
  /** Tags to record when a mark point or the answer is missed. */
  mistakeTags: MistakeTagId[];
}

export interface Lesson {
  style: LessonStyle;
  summary: string;
  knowledge: string[];
  vocabulary: { term: string; meaning: string }[];
  /** How to recognise this kind of question in an exam. */
  recognise: string;
  commandWords: { word: string; meaning: string }[];
  method: { title: string; detail: string }[];
  mistakes: { tag: MistakeTagId; text: string }[];
  worked: { question: string; marks: number; steps: WorkedStep[]; finalAnswer: string };
  guided: GuidedQuestion[];
  exam: ExamQuestion[];
}

const str = (v: unknown, min = 1, max = 2000): v is string => typeof v === "string" && v.trim().length >= min && v.length <= max;
const arr = (v: unknown): v is unknown[] => Array.isArray(v);
const obj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function validateAnswer(a: unknown, where: string, problems: string[]) {
  if (!obj(a)) return void problems.push(`${where}: answer missing`);
  switch (a.type) {
    case "numeric":
      if (typeof a.value !== "number" || !Number.isFinite(a.value)) problems.push(`${where}: numeric value`);
      if (a.tolerance !== undefined && (typeof a.tolerance !== "number" || a.tolerance < 0)) problems.push(`${where}: tolerance`);
      if (a.unit !== undefined && !str(a.unit, 1, 20)) problems.push(`${where}: unit`);
      break;
    case "choice":
      if (!arr(a.options) || a.options.length < 2 || a.options.length > 6 || !a.options.every((o) => str(o, 1, 300))) problems.push(`${where}: options`);
      else if (new Set(a.options).size !== a.options.length) problems.push(`${where}: duplicate options`);
      if (typeof a.correct !== "number" || !arr(a.options) || a.correct < 0 || a.correct >= a.options.length || !Number.isInteger(a.correct)) problems.push(`${where}: correct index`);
      break;
    case "text":
      if (!arr(a.accept) || a.accept.length === 0 || !a.accept.every((x) => str(x, 1, 100))) problems.push(`${where}: accepted answers`);
      break;
    case "extended":
      break;
    default:
      problems.push(`${where}: unknown answer type`);
  }
}

function validateTags(tags: unknown, where: string, problems: string[]) {
  if (!arr(tags)) return void problems.push(`${where}: tags`);
  for (const t of tags) if (typeof t !== "string" || !isMistakeTag(t)) problems.push(`${where}: unknown mistake tag ${String(t)}`);
}

/** Validates untrusted lesson JSON (from authors or the admin editor). Empty list = valid. */
export function validateLesson(input: unknown): string[] {
  const p: string[] = [];
  if (!obj(input)) return ["lesson must be an object"];
  const l = input;
  if (!["calculation", "analysis", "explanation", "evaluation"].includes(l.style as string)) p.push("style");
  if (!str(l.summary, 20, 600)) p.push("summary (20–600 characters)");
  if (!arr(l.knowledge) || l.knowledge.length < 2 || !l.knowledge.every((k) => str(k, 5, 300))) p.push("knowledge (at least 2 points)");
  if (!arr(l.vocabulary) || !l.vocabulary.every((v) => obj(v) && str(v.term, 1, 60) && str(v.meaning, 3, 300))) p.push("vocabulary");
  if (!str(l.recognise, 10, 600)) p.push("recognise");
  if (!arr(l.commandWords) || !l.commandWords.every((v) => obj(v) && str(v.word, 2, 100) && str(v.meaning, 3, 300))) p.push("commandWords");
  if (!arr(l.method) || l.method.length < 2 || !l.method.every((m) => obj(m) && str(m.title, 2, 80) && str(m.detail, 5, 600))) p.push("method (at least 2 steps)");
  if (!arr(l.mistakes) || l.mistakes.length < 1) p.push("mistakes (at least 1)");
  else l.mistakes.forEach((m, i) => {
    if (!obj(m) || !str(m.text, 5, 400)) p.push(`mistakes[${i}]`);
    else if (typeof m.tag !== "string" || !isMistakeTag(m.tag)) p.push(`mistakes[${i}]: unknown tag ${String(m.tag)}`);
  });

  const w = l.worked;
  if (!obj(w) || !str(w.question, 5, 1500) || typeof w.marks !== "number" || !arr(w.steps) || w.steps.length < 2 || !str(w.finalAnswer, 1, 1500)) {
    p.push("worked example (question, marks, at least 2 steps, final answer)");
  } else {
    w.steps.forEach((s, i) => {
      const where = `worked.steps[${i}]`;
      if (!obj(s) || !str(s.prompt, 5, 400) || !str(s.reveal, 1, 800) || !arr(s.choices) || s.choices.length < 2 || s.choices.length > 4) {
        p.push(where);
        return;
      }
      const correct = s.choices.filter((c) => obj(c) && c.correct === true).length;
      if (correct !== 1) p.push(`${where}: exactly one correct choice`);
      s.choices.forEach((c, j) => {
        if (!obj(c) || !str(c.text, 1, 300) || !str(c.feedback, 2, 400) || typeof c.correct !== "boolean") p.push(`${where}.choices[${j}]`);
        else if (c.tag !== undefined && (typeof c.tag !== "string" || !isMistakeTag(c.tag))) p.push(`${where}.choices[${j}]: unknown tag`);
      });
    });
  }

  if (!arr(l.guided) || l.guided.length < 1) p.push("guided (at least 1)");
  else l.guided.forEach((g, i) => {
    const where = `guided[${i}]`;
    if (!obj(g) || !str(g.question, 5, 1500) || !str(g.solution, 5, 1500) || typeof g.marks !== "number" || g.marks < 1) return void p.push(where);
    if (!arr(g.hints) || g.hints.length < 1 || !g.hints.every((h) => str(h, 5, 400))) p.push(`${where}: hints`);
    validateAnswer(g.answer, where, p);
    if (obj(g.answer) && g.answer.type === "extended") p.push(`${where}: guided answers must be markable`);
  });

  if (!arr(l.exam) || l.exam.length < 1) p.push("exam (at least 1)");
  else l.exam.forEach((q, i) => {
    const where = `exam[${i}]`;
    if (!obj(q) || !str(q.question, 5, 2000) || !str(q.modelAnswer, 5, 3000) || typeof q.marks !== "number" || q.marks < 1 || q.marks > 30) return void p.push(where);
    if (!arr(q.markScheme) || q.markScheme.length < 1 || !q.markScheme.every((m) => obj(m) && str(m.point, 3, 400) && typeof m.marks === "number" && m.marks >= 1)) {
      p.push(`${where}: markScheme`);
    } else {
      const total = q.markScheme.reduce((s, m) => s + (obj(m) ? (m.marks as number) : 0), 0);
      if (total !== q.marks) p.push(`${where}: mark scheme totals ${total}, question is worth ${q.marks}`);
    }
    validateAnswer(q.answer, where, p);
    validateTags(q.mistakeTags, where, p);
  });
  return p;
}

const normalise = (s: string) =>
  s.toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9.'/%-]+/g, " ").replace(/\s+/g, " ").trim();

/** Parses a typed number, allowing commas, spaces, a trailing unit and simple fractions. */
export function parseNumber(raw: string): number | null {
  const s = raw.trim().replace(/,/g, "").replace(/\s+/g, " ");
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (frac) {
    const d = Number(frac[2]);
    return d === 0 ? null : Number(frac[1]) / d;
  }
  const m = s.match(/^[£$]?\s*(-?\d*\.?\d+(?:e-?\d+)?)/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export type MarkResult = { status: "correct" | "incorrect" | "self_check" };

/** Marks an auto-markable answer. Extended answers return self_check. */
export function markAnswer(answer: Answer, given: string | number): MarkResult {
  switch (answer.type) {
    case "numeric": {
      const n = typeof given === "number" ? given : parseNumber(given);
      if (n === null) return { status: "incorrect" };
      const tol = answer.tolerance ?? 1e-9;
      return { status: Math.abs(n - answer.value) <= tol + 1e-12 ? "correct" : "incorrect" };
    }
    case "choice":
      return { status: Number(given) === answer.correct ? "correct" : "incorrect" };
    case "text": {
      const g = normalise(String(given));
      return { status: g.length > 0 && answer.accept.some((a) => normalise(a) === g) ? "correct" : "incorrect" };
    }
    case "extended":
      return { status: "self_check" };
  }
}

/** Marks from a self-check: the student ticks the mark-scheme points their answer contains. */
export function selfCheckMarks(scheme: MarkPoint[], ticked: boolean[]): number {
  return scheme.reduce((sum, m, i) => sum + (ticked[i] ? m.marks : 0), 0);
}
