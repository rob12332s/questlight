/**
 * Shared domain types. This folder is framework-free: no React, Next.js or Supabase imports,
 * so the rules here can be unit tested in isolation and mirrored exactly in SQL.
 */

export const EDUCATION_STAGES = ["primary", "secondary", "gcse", "a_level", "college", "university"] as const;
export type EducationStage = (typeof EDUCATION_STAGES)[number];

export const EDUCATION_STAGE_LABELS: Record<EducationStage, string> = {
  primary: "Primary",
  secondary: "Secondary (KS3)",
  gcse: "GCSE",
  a_level: "A-level",
  college: "College",
  university: "University",
};

/** Stages with real content at launch. Others exist in the data model only. */
export const LAUNCH_STAGES: readonly EducationStage[] = ["gcse"];

export const DIFFICULTIES = ["foundation", "standard", "challenge"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  foundation: "Foundation",
  standard: "Standard",
  challenge: "Challenge",
};

export const QUESTION_TYPES = ["multiple_choice", "true_false", "short_answer"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

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
