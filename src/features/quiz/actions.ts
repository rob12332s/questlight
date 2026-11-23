"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DIFFICULTIES } from "@/domain/types";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/server/session";

/** Turns database errors (we attach a HINT to each) into plain messages. */
function quizError(hint: string | undefined | null, fallback = "Something went wrong. Try again."): string {
  switch (hint) {
    case "not_enough_questions":
      return "There aren't enough questions for that choice yet. Try Mixed difficulty or another topic.";
    case "rate_limited":
      return "You've started a lot of quizzes in the last hour. Take a short break, then try again.";
    case "already_answered":
      return "You've already answered this question.";
    case "finished":
      return "This quiz has already finished.";
    case "not_found":
      return "We couldn't find that quiz.";
    case "invalid_answer":
      return "Choose an answer, or type one, before checking.";
    case "nothing_answered":
      return "Answer at least one question before finishing.";
    default:
      return fallback;
  }
}

const startSchema = z.object({
  topicId: z.string().uuid("Choose a topic."),
  difficulty: z.union([z.enum(DIFFICULTIES), z.literal("mixed")]),
  length: z.coerce.number().int().min(3).max(20),
});

export interface StartQuizState {
  error?: string;
}

export async function startQuiz(_prev: StartQuizState, formData: FormData): Promise<StartQuizState> {
  const student = await getCurrentStudent();
  if (!student) redirect("/login?next=/quizzes");

  const parsed = startSchema.safeParse({
    topicId: formData.get("topicId"),
    difficulty: formData.get("difficulty") ?? "mixed",
    length: formData.get("length") ?? 10,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your choices." };

  const supabase = await getServerSupabase();
  const { data, error } = await supabase.rpc("start_quiz", {
    p_topic: parsed.data.topicId,
    p_difficulty: parsed.data.difficulty === "mixed" ? null : parsed.data.difficulty,
    p_count: parsed.data.length,
  });
  if (error || typeof data !== "string") return { error: quizError(error?.hint) };
  redirect(`/quizzes/${data}`);
}

export interface AnswerReveal {
  ok: true;
  isCorrect: boolean;
  correctOption: string | null;
  acceptedAnswer: string | null;
  explanation: string;
  wrongOptionNotes: Record<string, string>;
}

export async function submitAnswer(
  sessionId: string,
  questionId: string,
  answer: string,
): Promise<AnswerReveal | { ok: false; error: string }> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.rpc("submit_quiz_answer", {
    p_session: sessionId,
    p_question: questionId,
    p_answer: answer,
  });
  if (error || !data) return { ok: false, error: quizError(error?.hint) };
  const r = data as {
    is_correct: boolean;
    correct_option: string | null;
    accepted_answer: string | null;
    explanation: string;
    wrong_option_notes: Record<string, string> | null;
  };
  return {
    ok: true,
    isCorrect: r.is_correct,
    correctOption: r.correct_option,
    acceptedAnswer: r.accepted_answer,
    explanation: r.explanation,
    wrongOptionNotes: r.wrong_option_notes ?? {},
  };
}

export interface QuizSummary {
  ok: true;
  answered: number;
  correct: number;
  totalQuestions: number;
  accuracy: number;
  previousBest: number | null;
  xp: { correctAnswers: number; completion: number; perfect: number; personalBest: number; capped: number; total: number };
  newAchievements: string[];
}

export async function completeQuiz(sessionId: string): Promise<QuizSummary | { ok: false; error: string }> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.rpc("complete_quiz", { p_session: sessionId });
  if (error || !data) return { ok: false, error: quizError(error?.hint) };
  const r = data as {
    answered: number;
    correct: number;
    total_questions: number;
    accuracy: number;
    previous_best: number | null;
    xp: { correct_answers: number; completion: number; perfect: number; personal_best: number; capped: number; total: number };
    new_achievements: string[];
  };
  revalidatePath("/dashboard");
  revalidatePath("/learn");
  return {
    ok: true,
    answered: r.answered,
    correct: r.correct,
    totalQuestions: r.total_questions,
    accuracy: Number(r.accuracy),
    previousBest: r.previous_best === null ? null : Number(r.previous_best),
    xp: {
      correctAnswers: r.xp.correct_answers,
      completion: r.xp.completion,
      perfect: r.xp.perfect,
      personalBest: r.xp.personal_best,
      capped: r.xp.capped,
      total: r.xp.total,
    },
    newAchievements: r.new_achievements ?? [],
  };
}

const reportSchema = z.object({
  questionId: z.string().uuid(),
  reason: z.enum(["incorrect_answer", "unclear", "inappropriate", "other"]),
  details: z.string().trim().max(500).optional(),
});

export async function reportQuestion(input: {
  questionId: string;
  reason: string;
  details?: string;
}): Promise<{ ok: boolean; message: string }> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Choose a reason for the report." };
  const supabase = await getServerSupabase();
  const { error } = await supabase.from("content_reports").insert({
    question_id: parsed.data.questionId,
    reason: parsed.data.reason,
    details: parsed.data.details || null,
  });
  if (error?.code === "23505") return { ok: true, message: "You've already reported this question. Thanks." };
  if (error) return { ok: false, message: "We couldn't send your report. Try again." };
  return { ok: true, message: "Thanks. We'll check this question." };
}
