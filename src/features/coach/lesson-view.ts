import type { Answer, ExamQuestion, Lesson } from "@/domain/lesson";

/**
 * What the browser receives for a lesson. Teaching content, worked examples and guided
 * practice are sent whole (they're for learning). Exam-style answers, mark schemes and
 * model answers stay on the server until the student submits an answer.
 */
export type PublicAnswer =
  | { type: "numeric"; unit?: string }
  | { type: "choice"; options: string[] }
  | { type: "text" }
  | { type: "extended" };

export interface PublicExamQuestion {
  question: string;
  marks: number;
  answer: PublicAnswer;
}

export type LessonView = Omit<Lesson, "exam"> & { exam: PublicExamQuestion[] };

export function publicAnswer(a: Answer): PublicAnswer {
  switch (a.type) {
    case "numeric":
      return a.unit ? { type: "numeric", unit: a.unit } : { type: "numeric" };
    case "choice":
      return { type: "choice", options: a.options };
    case "text":
      return { type: "text" };
    case "extended":
      return { type: "extended" };
  }
}

export function toLessonView(lesson: Lesson): LessonView {
  return {
    ...lesson,
    exam: lesson.exam.map((q: ExamQuestion) => ({ question: q.question, marks: q.marks, answer: publicAnswer(q.answer) })),
  };
}

/** The coach's modes, as offered on every topic page. */
export const COACH_MODES = [
  { id: "teach", title: "Teach me from the beginning", detail: "Explanation, key knowledge and the method, then a worked example and practice." },
  { id: "answer", title: "Show me how to answer", detail: "How to spot the question, what the command words want and the method to use." },
  { id: "worked", title: "Walk me through a worked example", detail: "You choose each next step; the coach explains every choice." },
  { id: "guided", title: "Practise with hints", detail: "Questions with hints one at a time, and the full solution after." },
  { id: "test", title: "Test me independently", detail: "Exam-style questions with no hints, marked at the end." },
  { id: "technique", title: "Improve my exam technique", detail: "Common ways marks are lost on this topic and how to avoid them." },
  { id: "marks", title: "Explain why I lost marks", detail: "Your recent results on this topic, what was missing and what to do next." },
] as const;

export type CoachModeId = (typeof COACH_MODES)[number]["id"];

export function isCoachMode(v: unknown): v is CoachModeId {
  return COACH_MODES.some((m) => m.id === v);
}
