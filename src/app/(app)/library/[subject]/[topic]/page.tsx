import type { Metadata } from "next";
import { ArrowRight, ListChecks } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { BOARD_NAMES } from "@/config/boards";
import { subjectStyle } from "@/config/subject-theme";
import { MASTERY_LABELS, topicMastery } from "@/domain/mastery";
import { COACH_MODES } from "@/features/coach/lesson-view";
import { CONTENT_STATUS, coverageText, LearningContext, ProBadge, skillLabel, StatusChip, tierLabel, VerificationChip } from "@/features/library/labels";
import { UpgradeButton } from "@/features/pro/upgrade";
import { getCoachAttempts, getCourses, getPlan, getSubjects, getTopicBySlug } from "@/server/library";
import { getCurrentStudent } from "@/server/session";
import { serverNowMs } from "@/server/time";

export const metadata: Metadata = { title: "Topic" };

export default async function TopicPage({ params }: { params: Promise<{ subject: string; topic: string }> }) {
  const { subject: subjectSlug, topic: topicSlug } = await params;
  const student = await getCurrentStudent();
  if (!student) redirect(`/login?next=/library/${subjectSlug}/${topicSlug}`);
  const subject = (await getSubjects()).find((s) => s.slug === subjectSlug);
  if (!subject) notFound();
  const [topic, courses, plan, attempts] = await Promise.all([
    getTopicBySlug(subject.id, topicSlug),
    getCourses(student.userId),
    getPlan(),
    getCoachAttempts(student.userId),
  ]);
  if (!topic) notFound();
  const course = courses.get(subject.id);
  const locked = topic.access === "pro" && !plan.pro;
  const mastery = topicMastery(topic.id, attempts, serverNowMs());
  const tier = tierLabel(topic.tier);
  const boardMismatch = course?.board && topic.coverage === "board_specific" && !topic.boards.includes(course.board);

  const facts: [string, React.ReactNode][] = [
    ["Main topic", topic.area],
    ["Subtopic", topic.subtopic ?? "—"],
    ["You'll learn to", topic.objective],
    ["Skill", skillLabel(topic.skill)],
    ["Exam boards", coverageText(topic)],
    ["Tier", tier ?? "Foundation and Higher"],
    ["Difficulty", topic.difficulty === "challenge" ? "Challenging" : topic.difficulty === "foundation" ? "Getting started" : "Standard"],
  ];
  if (topic.paper) facts.push(["Paper", topic.paper]);

  return (
    <div style={subjectStyle(subject.slug)}>
      <Link href={`/library/${subject.slug}`} className="text-sm text-ink-soft hover:text-ink">
        ← {subject.name}
      </Link>
      <h1 className="mt-4 max-w-3xl text-3xl font-semibold sm:text-4xl">{topic.title}</h1>
      <div className="mt-3">
        <LearningContext subject={subject.name} board={course?.board ?? null} tier={course?.tier ?? null} topic={topic.area} />
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <StatusChip status={topic.contentStatus} />
        <VerificationChip verification={topic.verification} />
        {topic.access === "pro" && <ProBadge locked={locked} />}
        {topic.qualification === "separate_only" && <span className="inline-flex h-6 items-center rounded-sm bg-slate px-2 text-xs text-ink-soft">Separate science only</span>}
      </div>

      {boardMismatch && course?.board && (
        <p className="mt-5 rounded-lg bg-caution/10 p-3 text-sm">
          This topic belongs to {coverageText(topic).replace(" only", "")}, not {BOARD_NAMES[course.board]}. It may not be on your exam.
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div>
          {topic.contentStatus === "lesson" ? (
            locked ? (
              <section className="rounded-2xl border border-pro/30 bg-pro-wash p-6">
                <h2 className="text-xl font-semibold">A full coach lesson is ready — in Pro</h2>
                <p className="mt-2 text-ink-soft">Pro opens every topic and the complete Exam Answer Coach.</p>
                <UpgradeButton reason={`“${topic.title}” is part of Pro.`} className={`${buttonClasses("primary", "md")} mt-5`}>
                  See Pro
                </UpgradeButton>
              </section>
            ) : (
              <section aria-labelledby="coach-heading">
                <h2 id="coach-heading" className="text-xl font-semibold">
                  How do you want to learn it?
                </h2>
                {!plan.pro && (
                  <p className="mt-1 text-sm text-ink-muted">
                    Free plan: {plan.lessonsToday} of {plan.freeLessonsPerDay} lessons opened today.
                  </p>
                )}
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {COACH_MODES.map((m, i) => (
                    <li key={m.id}>
                      <Link
                        href={`/coach/${topic.id}?mode=${m.id}`}
                        className={`group flex h-full flex-col rounded-xl border p-4 transition-colors hover:border-beam ${i === 0 ? "border-beam/50 bg-beam-wash" : "border-line bg-deep"}`}
                      >
                        <span className="flex items-center justify-between gap-2 font-semibold">
                          {m.title}
                          <ArrowRight className="h-4 w-4 text-ink-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </span>
                        <span className="mt-1 text-sm leading-relaxed text-ink-soft">{m.detail}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          ) : (
            <section className="rounded-2xl border border-line bg-deep p-6">
              <h2 className="text-xl font-semibold">{CONTENT_STATUS[topic.contentStatus].label}</h2>
              <p className="mt-2 text-ink-soft">
                {topic.contentStatus === "practice"
                  ? "The full coach lesson for this topic is being written. Quiz questions for this area are ready now."
                  : "This topic is listed so you can see your whole course. Its lesson is being written and isn't available yet."}
              </p>
              {topic.quizTopicId && (
                <Link href={`/quizzes?topic=${topic.quizTopicId}`} className={`${buttonClasses("primary", "md")} mt-5`}>
                  <ListChecks className="h-4 w-4" aria-hidden /> Practise with a quiz
                </Link>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-line bg-deep p-5">
            <p className="text-sm text-ink-soft">Your mastery</p>
            <p className="mt-1 text-lg font-semibold">{MASTERY_LABELS[mastery.level]}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{mastery.reason}</p>
          </div>
          <dl className="space-y-3 rounded-2xl border border-line bg-deep p-5 text-sm">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt className="text-ink-muted">{k}</dt>
                <dd className="mt-0.5">{v}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
}
