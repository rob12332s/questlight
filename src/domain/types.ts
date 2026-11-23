/**
 * Shared domain types. This folder is framework-free: no React, Next.js or Supabase imports,
 * so the rules here can be unit tested in isolation and mirrored exactly in SQL.
 */

export const EDUCATION_STAGES = ["primary", "secondary", "gcse", "a_level", "college"] as const;
export type EducationStage = (typeof EDUCATION_STAGES)[number];

export const EDUCATION_STAGE_LABELS: Record<EducationStage, string> = {
  primary: "Primary",
  secondary: "Secondary (KS3)",
  gcse: "GCSE",
  a_level: "A-level",
  college: "College",
};

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** Where a question came from. Shown to students so AI content is always labelled. */
export const QUESTION_SOURCES = ["question_bank", "ai_generated", "teacher_created"] as const;
export type QuestionSource = (typeof QUESTION_SOURCES)[number];

export const OPTION_IDS = ["A", "B", "C", "D"] as const;
export type OptionId = (typeof OPTION_IDS)[number];

export interface AnswerOption {
  id: OptionId;
  text: string;
}

/** What a student may see before answering. Never contains the answer or explanation. */
export interface PublicQuestion {
  id: string;
  topicId: string;
  text: string;
  options: AnswerOption[];
  difficulty: Difficulty;
  source: QuestionSource;
}

/** Revealed only after an answer is submitted (solo) or the round closes (multiplayer). */
export interface AnswerReveal {
  correctOptionId: OptionId;
  explanation: string;
  /** Optional notes on why particular wrong options are wrong. */
  wrongOptionNotes?: Partial<Record<OptionId, string>>;
}

export function isEducationStage(value: unknown): value is EducationStage {
  return typeof value === "string" && (EDUCATION_STAGES as readonly string[]).includes(value);
}

export function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === "string" && (DIFFICULTIES as readonly string[]).includes(value);
}

export function isOptionId(value: unknown): value is OptionId {
  return typeof value === "string" && (OPTION_IDS as readonly string[]).includes(value);
}
