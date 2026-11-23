import type { AnswerOption, Difficulty, QuestionType } from "@/domain/types";

export interface PlayerQuestion {
  id: string;
  type: QuestionType;
  text: string;
  options: AnswerOption[] | null;
  difficulty: Difficulty;
}

export interface QuestionResult {
  submitted: string;
  isCorrect: boolean;
  /** Present once revealed by the server. */
  correctOption?: string | null;
  acceptedAnswer?: string | null;
  explanation?: string;
  wrongOptionNotes?: Record<string, string>;
}

export interface ReviewRow {
  questionId: string;
  submitted: string | null;
  isCorrect: boolean | null;
  correctOption: string | null;
  acceptedAnswer: string | null;
  explanation: string;
}
