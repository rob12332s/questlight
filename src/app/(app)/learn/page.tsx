import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { SubjectIcon } from "@/components/subject-icon";
import { subjectStyle } from "@/config/subject-theme";
import { ButtonLink } from "@/components/ui/button";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCurriculum, getTopicProgress, MIN_ANSWERS_FOR_RECOMMENDATION } from "@/server/learning";
import { getCurrentStudent } from "@/server/session";

export const metadata: Metadata = { title: "Learn" };

export default async function LearnPage() {
  const student = await getCurrentStudent();
  if (!student) redirect("/login?next=/learn");
  const supabase = await getServerSupabase();
  const [curriculum, progress, chosen] = await Promise.all([
    getCurriculum(),
    getTopicProgress(student.userId),
    supabase.from("profile_subjects").select("subject_id").eq("profile_id", student.userId),
  ]);
  const chosenIds = new Set(((chosen.data ?? []) as Array<{ subject_id: string }>).map((r) => r.subject_id));
  // The student's own subjects first, then the rest in the usual order.
  const subjects = [...curriculum].sort((a, b) => Number(chosenIds.has(b.id)) - Number(chosenIds.has(a.id)));

  return (
    <div className="room-glow">
      <h1 className="text-3xl font-semibold sm:text-4xl">Learn</h1>
      <p className="mt-2 max-w-xl text-ink-soft">
        GCSE topics, with your accuracy on each once you&apos;ve practised it.{" "}
        {chosenIds.size === 0 && (
          <Link href="/settings#subjects" className="text-ink underline decoration-line-strong underline-offset-4">
            Choose your subjects
          </Link>
        )}
      </p>

      <nav aria-label="Subjects" className="mt-6 flex flex-wrap gap-2">
        {subjects.map((s) => (
          <a
            key={s.id}
            href={`#${s.slug}`}
            style={subjectStyle(s.slug)}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-deep/60 pr-3.5 pl-1.5 text-sm text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
          >
            <span className="subject-chip flex h-6 w-6 items-center justify-center rounded-full">
              <SubjectIcon slug={s.slug} className="h-3.5 w-3.5" />
            </span>
            {s.name}
          </a>
        ))}
      </nav>

      <div className="mt-10 space-y-12">
        {subjects.map((subject) => (
          <section
            key={subject.id}
            id={subject.slug}
            aria-labelledby={`${subject.slug}-h`}
            className="scroll-mt-24"
            style={subjectStyle(subject.slug)}
          >
            <Reveal>
              <div className="flex items-center gap-3">
                <span className="subject-chip flex h-10 w-10 items-center justify-center rounded-lg">
                  <SubjectIcon slug={subject.slug} className="h-5 w-5" />
                </span>
                <h2 id={`${subject.slug}-h`} className="text-xl font-semibold">
                  {subject.name}
                </h2>
                {chosenIds.has(subject.id) && <span className="rounded-sm bg-beam-wash px-2 py-0.5 text-xs text-beam-bright">Your subject</span>}
              </div>
            </Reveal>
            {subject.topics.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">Topics for this subject are being written.</p>
            ) : (
              <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-deep/40">
                {subject.topics.map((topic, i) => {
                  const p = progress.get(topic.id);
                  const enough = p && p.questionsAttempted >= MIN_ANSWERS_FOR_RECOMMENDATION;
                  const accuracy = p && p.questionsAttempted > 0 ? p.correctAnswers / p.questionsAttempted : null;
                  return (
                    <Reveal as="li" key={topic.id} delay={i * 60} className="grid gap-4 p-5 sm:grid-cols-[1fr_12rem_auto] sm:items-center">
                      <div className="min-w-0">
                        <h3 className="font-medium">{topic.name}</h3>
                        {topic.description && <p className="mt-0.5 text-sm text-ink-muted">{topic.description}</p>}
                        <p className="mt-1 text-xs text-ink-muted">{topic.questionCount} questions</p>
                      </div>
                      <div>
                        {p && accuracy !== null ? (
                          <>
                            <div className="flex justify-between text-xs text-ink-soft">
                              <span>{enough ? "Recent accuracy" : "Early results"}</span>
                              <span className="tabular">{Math.round((enough ? p.mastery : accuracy) * 100)}%</span>
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate">
                              <div
                                className="subject-fill h-full rounded-full transition-[width] duration-700"
                                style={{ width: `${Math.round((enough ? p.mastery : accuracy) * 100)}%` }}
                              />
                            </div>
                            <p className="tabular mt-1 text-xs text-ink-muted">{p.questionsAttempted} answered</p>
                          </>
                        ) : (
                          <p className="text-sm text-ink-muted">Not started</p>
                        )}
                      </div>
                      <ButtonLink href={`/quizzes?topic=${topic.id}`} variant={p ? "secondary" : "primary"} size="sm">
                        {p ? "Practise again" : "Start"}
                      </ButtonLink>
                    </Reveal>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
