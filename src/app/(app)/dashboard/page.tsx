import type { Metadata } from "next";
import { ArrowRight, Check, Circle, Flame, Layers, ListChecks, Swords, Trophy } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SubjectIcon } from "@/components/subject-icon";
import { ButtonLink } from "@/components/ui/button";
import { subjectStyle } from "@/config/subject-theme";
import { FormAlert } from "@/components/ui/form";
import { currentStreak, levelFromXp } from "@/domain/progression";
import { recommendNext, type TopicFacts } from "@/domain/recommendations";
import { EDUCATION_STAGE_LABELS } from "@/domain/types";
import { LevelProgress } from "@/features/progress/level-progress";
import { cn } from "@/lib/cn";
import { getServerSupabase } from "@/lib/supabase/server";
import { getActivityDays, getCurriculum, getRecentQuizzes, getTopicProgress, todayInLondon } from "@/server/learning";
import { getCurrentStudent } from "@/server/session";

export const metadata: Metadata = { title: "Dashboard" };

const KIND_LABEL = {
  revisit_weak: "Needs work",
  return_after_gap: "Time to revisit",
  start_new: "Not started",
  stretch: "Ready to stretch",
} as const;

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ passwordUpdated?: string }> }) {
  const { passwordUpdated } = await searchParams;
  const student = await getCurrentStudent();
  if (!student) redirect("/login");
  const supabase = await getServerSupabase();

  // Everything here comes from the student's own rows (RLS-scoped). Nothing is estimated.
  const [chosenResult, curriculum, progress, recent, activityDays] = await Promise.all([
    supabase.from("profile_subjects").select("subject_id").eq("profile_id", student.userId),
    getCurriculum(),
    getTopicProgress(student.userId),
    getRecentQuizzes(student.userId, 4),
    getActivityDays(student.userId),
  ]);
  const chosenIds = new Set(((chosenResult.data ?? []) as Array<{ subject_id: string }>).map((r) => r.subject_id));
  const subjects = curriculum.filter((s) => chosenIds.has(s.id));
  const level = levelFromXp(student.profile.xp);
  const streak = currentStreak(activityDays, todayInLondon());
  const questionsAnswered = [...progress.values()].reduce((sum, p) => sum + p.questionsAttempted, 0);

  const topicIndex = new Map(curriculum.flatMap((s) => s.topics.map((t) => [t.id, { topic: t, subject: s }] as const)));
  const practised: TopicFacts[] = [...progress.values()].flatMap((p) => {
    const found = topicIndex.get(p.topicId);
    if (!found) return [];
    return [
      {
        topicId: p.topicId,
        topicName: found.topic.name,
        subjectName: found.subject.name,
        questionsAttempted: p.questionsAttempted,
        correctAnswers: p.correctAnswers,
        mastery: p.mastery,
        lastPractisedAt: p.lastPractisedAt ? new Date(p.lastPractisedAt) : null,
      },
    ];
  });
  const untried = (subjects.length > 0 ? subjects : curriculum).flatMap((s) =>
    s.topics
      .filter((t) => !progress.has(t.id) && t.questionCount >= 3)
      .map((t) => ({ topicId: t.id, topicName: t.name, subjectName: s.name })),
  );
  const recommendations = recommendNext(practised, untried);

  const steps = [
    { done: true, label: "Create your account" },
    { done: subjects.length > 0, label: "Choose your subjects", href: "/settings#subjects" },
    { done: recent.length > 0, label: "Finish your first quiz", href: "/quizzes" },
  ];
  const showSteps = steps.some((s) => !s.done);
  const slugByName = new Map(curriculum.map((s) => [s.name, s.slug]));
  const actions = [
    { href: "/quizzes", label: "Revise a topic", hint: "Quiz with explanations", icon: ListChecks },
    { href: "/play", label: "Play live", hint: "Same questions, same time", icon: Swords },
    { href: "/flashcards", label: "Review flashcards", hint: "Spaced repetition", icon: Layers },
    { href: "/leaderboards", label: "Leaderboards", hint: "This week's top XP", icon: Trophy },
  ];
  const stage = student.profile.education_stage;

  return (
    <div className="room-glow">
      {passwordUpdated !== undefined && (
        <div className="mb-6">
          <FormAlert tone="success">Your new password is saved.</FormAlert>
        </div>
      )}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Hi, {student.profile.display_name}</h1>
          <p className="mt-2 text-ink-soft">
            {stage ? EDUCATION_STAGE_LABELS[stage] : "No stage chosen"}
            {subjects.length > 0 && `, ${subjects.length} subject${subjects.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <ButtonLink href="/quizzes" size="lg">
          Start a quiz <ArrowRight className="h-4 w-4" aria-hidden />
        </ButtonLink>
      </header>

      <nav aria-label="Quick actions" className="mt-8 animate-enter">
        <ul className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
          {actions.map((a) => (
            <li key={a.href}>
              <Link
                href={a.href}
                className="group flex h-full items-center gap-3 rounded-xl border border-line bg-deep/70 p-3.5 backdrop-blur-sm transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-beam/40 hover:bg-deep"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-beam-wash text-beam-bright transition-transform duration-300 group-hover:scale-105">
                  <a.icon className="h-5 w-5" aria-hidden strokeWidth={1.75} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.9375rem] leading-tight font-medium">{a.label}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-ink-muted">{a.hint}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section aria-labelledby="progress-heading" className="animate-enter rounded-xl border border-line bg-deep p-6 [animation-delay:60ms]">
          <h2 id="progress-heading" className="sr-only">
            Your progress
          </h2>
          <LevelProgress progress={level} totalXp={student.profile.xp} />
          <dl className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-line">
            <div className="min-w-0 bg-deep p-3 sm:p-4">
              <dt className="text-xs text-ink-muted sm:text-sm">Answered</dt>
              <dd className="tabular mt-1 text-2xl font-semibold">{questionsAnswered}</dd>
            </div>
            <div className="min-w-0 bg-deep p-3 sm:p-4">
              <dt className="text-xs text-ink-muted sm:text-sm">Topics</dt>
              <dd className="tabular mt-1 text-2xl font-semibold">{progress.size}</dd>
            </div>
            <div className="min-w-0 bg-deep p-3 sm:p-4">
              <dt className="flex items-center gap-1 text-xs text-ink-muted sm:text-sm">
                <Flame className={cn("h-3.5 w-3.5", streak > 0 && "text-caution")} aria-hidden /> Streak
              </dt>
              <dd className="tabular mt-1 text-2xl font-semibold">
                {streak}
                <span className="ml-1 text-sm font-normal text-ink-muted">{streak === 1 ? "day" : "days"}</span>
              </dd>
            </div>
          </dl>
        </section>

        {showSteps ? (
          <section aria-labelledby="steps-heading" className="animate-enter rounded-xl border border-line p-6 [animation-delay:120ms]">
            <h2 id="steps-heading" className="font-semibold">
              Getting started
            </h2>
            <ol className="mt-4 space-y-3">
              {steps.map((step) => (
                <li key={step.label} className="flex items-center gap-3">
                  {step.done ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-correct text-white">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                    </span>
                  ) : (
                    <Circle className="h-6 w-6 text-line-strong" aria-hidden />
                  )}
                  <span className={cn("flex-1", step.done ? "text-ink-muted line-through" : "text-ink")}>
                    {!step.done && step.href ? (
                      <Link href={step.href} className="underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                        {step.label}
                      </Link>
                    ) : (
                      step.label
                    )}
                    <span className="sr-only">{step.done ? " (done)" : " (to do)"}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ) : (
          <section aria-labelledby="recent-heading" className="animate-enter rounded-xl border border-line p-6 [animation-delay:120ms]">
            <div className="flex items-center justify-between">
              <h2 id="recent-heading" className="font-semibold">
                Recent quizzes
              </h2>
              <Link href="/quizzes" className="text-sm text-ink-soft hover:text-ink">
                All quizzes
              </Link>
            </div>
            <ul className="mt-3 divide-y divide-line">
              {recent.map((q) => (
                <li key={q.id}>
                  <Link href={`/quizzes/${q.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-ink">
                    <span className="min-w-0 truncate text-sm">{q.topicName}</span>
                    <span className="tabular shrink-0 text-sm text-ink-soft">
                      {q.correct}/{q.total}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <section aria-labelledby="next-heading" className="mt-10 animate-enter [animation-delay:180ms]">
        <h2 id="next-heading" className="text-xl font-semibold">
          What to study next
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Based on your answers. A topic is only judged once you&apos;ve answered at least 10 questions on it.
        </p>
        {recommendations.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-line-strong p-8 text-center">
            <p className="font-medium">Nothing to suggest yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">Take a few quizzes and suggestions will appear here.</p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            {recommendations.map((rec) => (
              <li key={`${rec.kind}-${rec.topicId}`}>
                <Link
                  href={`/quizzes?topic=${rec.topicId}`}
                  style={subjectStyle(slugByName.get(rec.subjectName) ?? "")}
                  className="group flex h-full flex-col rounded-xl border border-line bg-deep/60 p-5 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="subject-chip flex h-9 w-9 items-center justify-center rounded-lg">
                      <SubjectIcon slug={slugByName.get(rec.subjectName) ?? ""} className="h-[18px] w-[18px]" />
                    </span>
                    <span
                      className={cn(
                        "rounded-sm px-2 py-0.5 text-xs",
                        rec.kind === "revisit_weak" ? "bg-incorrect/15 text-incorrect" : "bg-beam-wash text-beam-bright",
                      )}
                    >
                      {KIND_LABEL[rec.kind]}
                    </span>
                  </span>
                  <span className="mt-4 font-medium">{rec.topicName}</span>
                  <span className="subject-text text-sm">{rec.subjectName}</span>
                  <span className="mt-2 flex-1 text-sm text-ink-soft">{rec.reason}</span>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm text-beam-bright">
                    Practise
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="subjects-heading" className="mt-10 animate-enter [animation-delay:240ms]">
        <div className="flex items-center justify-between gap-4">
          <h2 id="subjects-heading" className="text-xl font-semibold">
            Your subjects
          </h2>
          {subjects.length > 0 && (
            <Link href="/settings#subjects" className="text-sm text-ink-soft hover:text-ink">
              Edit
            </Link>
          )}
        </div>
        {subjects.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-line-strong p-8 text-center">
            <p className="font-medium">Choose the subjects you&apos;re studying</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">Suggestions will focus on them.</p>
            <ButtonLink href="/settings#subjects" variant="secondary" className="mt-5">
              Choose subjects
            </ButtonLink>
          </div>
        ) : (
          <ul className="mt-4 grid gap-px overflow-hidden rounded-xl bg-line sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <li key={subject.slug}>
                <Link
                  href={`/learn#${subject.slug}`}
                  style={subjectStyle(subject.slug)}
                  className="flex items-center gap-3 bg-night p-4 transition-colors hover:bg-deep"
                >
                  <span className="subject-chip flex h-9 w-9 items-center justify-center rounded-lg">
                    <SubjectIcon slug={subject.slug} className="h-[18px] w-[18px]" />
                  </span>
                  <span className="flex-1">{subject.name}</span>
                  <span className="text-xs text-ink-muted">{subject.topics.length} topics</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
