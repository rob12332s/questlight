import type { Metadata } from "next";
import { Check, Circle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SubjectIcon } from "@/components/subject-icon";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { levelFromXp } from "@/domain/progression";
import { EDUCATION_STAGE_LABELS } from "@/domain/types";
import { LevelProgress } from "@/features/progress/level-progress";
import { getServerSupabase } from "@/lib/supabase/server";
import { cn } from "@/lib/cn";
import { getCurrentStudent } from "@/server/session";

export const metadata: Metadata = { title: "Dashboard" };

interface SubjectRow {
  subjects: { slug: string; name: string } | null;
}

export default async function DashboardPage() {
  const student = await getCurrentStudent();
  if (!student) redirect("/login");
  const supabase = await getServerSupabase();

  // Everything shown here is read from the student's own rows (RLS-scoped). Nothing is estimated.
  const [subjectsResult, progressResult] = await Promise.all([
    supabase.from("profile_subjects").select("subjects(slug, name)").eq("profile_id", student.userId),
    supabase.from("user_progress").select("questions_attempted").eq("player_id", student.userId),
  ]);
  const subjects = ((subjectsResult.data ?? []) as unknown as SubjectRow[])
    .map((row) => row.subjects)
    .filter((s): s is { slug: string; name: string } => s !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
  const progressRows = (progressResult.data ?? []) as Array<{ questions_attempted: number }>;
  const questionsAnswered = progressRows.reduce((sum, row) => sum + row.questions_attempted, 0);
  const level = levelFromXp(student.profile.xp);
  const stage = student.profile.education_stage;

  const steps = [
    { done: true, label: "Create your account" },
    { done: subjects.length > 0, label: "Choose your subjects", href: "/settings#subjects" },
    { done: false, label: "Take your first quiz", soon: true },
  ];

  return (
    <div>
      <header>
        <h1 className="text-3xl font-semibold sm:text-4xl">Hi, {student.profile.display_name}</h1>
        <p className="mt-2 text-ink-soft">
          {stage ? EDUCATION_STAGE_LABELS[stage] : "No stage chosen"}
          {subjects.length > 0 && `, ${subjects.length} subject${subjects.length === 1 ? "" : "s"}`}
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section aria-labelledby="progress-heading" className="animate-enter rounded-xl border border-line bg-deep p-6 [animation-delay:60ms]">
          <h2 id="progress-heading" className="sr-only">
            Your progress
          </h2>
          <LevelProgress progress={level} totalXp={student.profile.xp} />
          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-line">
            <div className="bg-deep p-4">
              <dt className="text-sm text-ink-muted">Questions answered</dt>
              <dd className="tabular mt-1 text-2xl font-semibold">{questionsAnswered}</dd>
            </div>
            <div className="bg-deep p-4">
              <dt className="text-sm text-ink-muted">Topics practised</dt>
              <dd className="tabular mt-1 text-2xl font-semibold">{progressRows.length}</dd>
            </div>
          </dl>
        </section>

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
                {step.soon && !step.done && <StatusBadge status="in_development" />}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section aria-labelledby="subjects-heading" className="mt-10 animate-enter [animation-delay:180ms]">
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
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
              Quizzes, flashcards and suggestions will focus on them.
            </p>
            <ButtonLink href="/settings#subjects" variant="secondary" className="mt-5">
              Choose subjects
            </ButtonLink>
          </div>
        ) : (
          <ul className="mt-4 grid gap-px overflow-hidden rounded-xl bg-line sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <li key={subject.slug} className="flex items-center gap-3 bg-night p-4">
                <SubjectIcon slug={subject.slug} className="h-5 w-5 text-ink-muted" />
                {subject.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="weak-heading" className="mt-10 animate-enter [animation-delay:240ms]">
        <h2 id="weak-heading" className="text-xl font-semibold">
          Topics to work on
        </h2>
        <div className="mt-4 rounded-xl border border-dashed border-line-strong p-8 text-center">
          <p className="font-medium">Nothing to suggest yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">
            After you&apos;ve answered at least 10 questions on a topic, your weakest topics will show up here with a
            suggested next step.
          </p>
        </div>
      </section>
    </div>
  );
}
