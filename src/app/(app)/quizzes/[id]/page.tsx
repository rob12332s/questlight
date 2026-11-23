import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { AnswerOption, Difficulty, QuestionType } from "@/domain/types";
import { QuizPlayer } from "@/features/quiz/quiz-player";
import { QuizResults } from "@/features/quiz/quiz-results";
import type { PlayerQuestion, QuestionResult } from "@/features/quiz/types";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/server/session";

export const metadata: Metadata = { title: "Quiz" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const student = await getCurrentStudent();
  if (!student) redirect(`/login?next=/quizzes/${id}`);
  const supabase = await getServerSupabase();

  // RLS: a student can only read their own quiz sessions and attempts.
  const { data: session } = await supabase
    .from("quiz_sessions")
    .select("id, status, topic_id, question_ids, correct_count, xp_awarded, topics(name, subjects(name))")
    .eq("id", id)
    .maybeSingle();
  if (!session) notFound();
  const s = session as unknown as {
    id: string;
    status: "in_progress" | "completed" | "abandoned";
    topic_id: string | null;
    question_ids: string[];
    correct_count: number;
    xp_awarded: number;
    topics: { name: string; subjects: { name: string } | null } | null;
  };

  const [{ data: questionRows }, { data: attemptRows }] = await Promise.all([
    supabase.from("questions").select("id, question_type, question_text, options, difficulty").in("id", s.question_ids),
    supabase.from("quiz_attempts").select("question_id, submitted_answer, is_correct").eq("session_id", id),
  ]);

  const byId = new Map(
    ((questionRows ?? []) as Array<{
      id: string;
      question_type: QuestionType;
      question_text: string;
      options: AnswerOption[] | null;
      difficulty: Difficulty;
    }>).map((q) => [q.id, q]),
  );
  const questions: PlayerQuestion[] = s.question_ids
    .map((qid) => byId.get(qid))
    .filter((q): q is NonNullable<typeof q> => Boolean(q))
    .map((q) => ({ id: q.id, type: q.question_type, text: q.question_text, options: q.options, difficulty: q.difficulty }));

  const results: Record<string, QuestionResult> = {};
  for (const a of (attemptRows ?? []) as Array<{ question_id: string; submitted_answer: string; is_correct: boolean }>) {
    results[a.question_id] = { submitted: a.submitted_answer, isCorrect: a.is_correct };
  }

  const topicName = s.topics?.name ?? "Quiz";
  const subjectName = s.topics?.subjects?.name ?? "";

  if (s.status === "completed") {
    // Finished quizzes can show the answers and explanations.
    const { data: review } = await supabase.rpc("get_quiz_review", { p_session: id });
    for (const row of (review ?? []) as Array<{
      question_id: string;
      submitted_answer: string | null;
      is_correct: boolean | null;
      correct_option: string | null;
      accepted_answer: string | null;
      explanation: string;
    }>) {
      if (row.submitted_answer === null) continue;
      results[row.question_id] = {
        submitted: row.submitted_answer,
        isCorrect: Boolean(row.is_correct),
        correctOption: row.correct_option,
        acceptedAnswer: row.accepted_answer,
        explanation: row.explanation,
      };
    }
    const answered = Object.keys(results).length;
    return (
      <QuizResults
        historical
        topicId={s.topic_id}
        topicName={topicName}
        questions={questions}
        results={results}
        summary={{
          ok: true,
          answered,
          correct: s.correct_count,
          totalQuestions: questions.length,
          accuracy: answered === 0 ? 0 : s.correct_count / answered,
          previousBest: null,
          xp: { correctAnswers: 0, completion: 0, perfect: 0, personalBest: 0, capped: 0, total: s.xp_awarded },
          newAchievements: [],
        }}
      />
    );
  }

  if (questions.length === 0) notFound();
  return (
    <QuizPlayer
      sessionId={s.id}
      topicId={s.topic_id}
      topicName={topicName}
      subjectName={subjectName}
      questions={questions}
      initialResults={results}
    />
  );
}
