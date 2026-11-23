import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { QuizSetup } from "@/features/quiz/quiz-setup";
import { getCurrentStudent } from "@/server/session";
import { getCurriculum, getRecentQuizzes } from "@/server/learning";

export const metadata: Metadata = { title: "Quizzes" };

export default async function QuizzesPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const student = await getCurrentStudent();
  if (!student) redirect("/login?next=/quizzes");
  const [{ topic }, curriculum, recent] = await Promise.all([
    searchParams,
    getCurriculum(),
    getRecentQuizzes(student.userId, 8),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-semibold sm:text-4xl">Quizzes</h1>
      <p className="mt-2 max-w-xl text-ink-soft">
        One question at a time, checked as you go, with an explanation after every answer.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <section aria-labelledby="new-quiz" className="animate-enter rounded-xl border border-line bg-deep p-6 [animation-delay:60ms]">
          <h2 id="new-quiz" className="text-lg font-semibold">
            New quiz
          </h2>
          <div className="mt-5">
            <QuizSetup
              subjects={curriculum.map((s) => ({
                id: s.id,
                name: s.name,
                topics: s.topics.filter((t) => t.questionCount >= 3),
              }))}
              initialTopicId={topic}
            />
          </div>
        </section>

        <section aria-labelledby="recent-quizzes" className="animate-enter [animation-delay:120ms]">
          <h2 id="recent-quizzes" className="text-lg font-semibold">
            Recent quizzes
          </h2>
          {recent.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-line-strong p-6 text-sm text-ink-soft">
              Your finished quizzes will appear here, so you can look back at your answers.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
              {recent.map((quiz) => (
                <li key={quiz.id}>
                  <Link
                    href={`/quizzes/${quiz.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-slate/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{quiz.topicName}</span>
                      <span className="block text-sm text-ink-muted">
                        {quiz.subjectName}, {new Date(quiz.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </span>
                    <span className="tabular shrink-0 text-right text-sm">
                      <span className="block font-semibold">
                        {quiz.correct}/{quiz.total}
                      </span>
                      <span className="block text-ink-muted">+{quiz.xp} XP</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
