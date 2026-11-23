import type { SubjectSlug } from "@/config/subjects";
import type { Difficulty } from "@/domain/types";

/**
 * Authoring format for the original question bank. Questions are written for
 * Questlight; none are copied from exam papers or textbooks, and no exam-board label
 * is applied until content has been checked against that specification.
 *
 * `scripts/build-question-bank.ts` turns this into a SQL migration with stable ids,
 * and tests/unit/question-bank.test.ts validates every question.
 */
interface Base {
  /** Stable key within the topic; never reuse a key for a different question. */
  key: string;
  difficulty: Difficulty;
  q: string;
  explain: string;
}

export type BankQuestion =
  | (Base & { type: "mc"; options: [string, string, string, string]; answer: 0 | 1 | 2 | 3 })
  | (Base & { type: "tf"; answer: boolean })
  | (Base & { type: "short"; accept: string[] });

export interface BankTopic {
  subject: SubjectSlug;
  slug: string;
  name: string;
  description: string;
  questions: BankQuestion[];
}
