import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { QuizSetup } from "@/features/quiz/quiz-setup";
import { cn } from "@/lib/cn";
import { getServerSupabase } from "@/lib/supabase/server";
import { MIN_ANSWERS_FOR_RECOMMENDATION, getCurriculum, getRecentQuizzes, getTopicProgress } from "@/server/learning";
import { getCurrentStudent } from "@/server/session";

export const metadata: Metadata = { title: "Quizzes" };

export default async function QuizzesPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const student = await getCurrentStudent();
  if (!student) redirect("/login?next=/quizzes");
  const supabase = await getServerSupabase();
  const [{ topic }, curriculum, recent, progress, { data: mine }] = await Promise.all([
    searchParams,
    getCurriculum(),
    getRecentQuizzes(student.userId, 6),
    getTopicProgress(student.userId),
    supabase.from("profile_subjects").select("subject_id").eq("profile_id", student.userId),
  ]);
  const mySubjects = new Set(((mine ?? []) as Array<{ subject_id: string }>).map((r) => r.subject_id));

  // The student's own subjects first, then the rest in the usual order.
  const subjects = curriculum
    .map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      isMine: mySubjects.has(s.id),
      topics: s.topics
        .filter((t) => t.questionCount >= 3)
        .map((t) => {
          const p = progress.get(t.id);
          return {
            id: t.id,
            name: t.name,
            description: t.description,
            questionCount: t.questionCount,
            multipleChoiceCount: t.multipleChoiceCount,
            // Same rule as the Learn page: recent accuracy once there's enough data.
            accuracy:
              p && p.questionsAttempted > 0
                ? p.questionsAttempted >= MIN_ANSWERS_FOR_RECOMMENDATION
                  ? p.mastery
                  : p.correctAnswers / p.questionsAttempted
                : null,
          };
        }),
    }))
    .sort((a, b) => Number(b.isMine) - Number(a.isMine));

  return (
    <div className="room-glow">
      <h1 className="text-3xl font-semibold sm:text-4xl">Start a quiz</h1>
      <p className="mt-2 max-w-xl text-ink-soft">
        One question at a time, checked as you go, with an explanation after every answer.
      </p>

      <div className="mt-10 animate-enter [animation-delay:60ms]">
        <QuizSetup subjects={subjects} initialTopicId={topic} />
      </div>

      {recent.length > 0 && (
        <section aria-labelledby="recent-quizzes" className="mt-16">
          <h2 id="recent-quizzes" className="text-lg font-semibold">
            Recent quizzes
          </h2>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((quiz) => {
              const pct = quiz.total > 0 ? quiz.correct / quiz.total : 0;
              return (
                <li key={quiz.id}>
                  <Link
                    href={`/quizzes/${quiz.id}`}
                    className="flex h-full flex-col justify-between gap-3 rounded-xl border border-line bg-deep p-4 transition-colors hover:border-line-strong hover:bg-slate/60"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{quiz.topicName}</span>
                      <span className="block text-sm text-ink-muted">
                        {quiz.subjectName}, {new Date(quiz.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-raised" aria-hidden>
                        <span
                          className={cn("block h-full rounded-full", pct >= 0.8 ? "bg-correct" : pct >= 0.5 ? "bg-beam" : "bg-caution")}
                          style={{ width: `${Math.round(pct * 100)}%` }}
                        />
                      </span>
                      <span className="tabular text-sm font-semibold">
                        {quiz.correct}/{quiz.total}
                      </span>
                      <span className="tabular text-sm text-ink-muted">+{quiz.xp} XP</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
