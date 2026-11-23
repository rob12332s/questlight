"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { Award, Check, X } from "lucide-react";
import { useEffect } from "react";
import { ButtonLink } from "@/components/ui/button";
import { XP_RULES } from "@/domain/progression";
import type { QuizSummary } from "./actions";
import type { PlayerQuestion, QuestionResult } from "./types";

const ACHIEVEMENT_NAMES: Record<string, string> = {
  first_quiz: "First steps",
  perfect_quiz: "Clean sheet",
  century: "Century",
  comeback: "Comeback",
};

function CountUp({ to, className }: { to: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  const value = useMotionValue(reduceMotion ? to : 0);
  const text = useTransform(value, (v) => Math.round(v).toString());
  useEffect(() => {
    if (reduceMotion) return;
    const controls = animate(value, to, { duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [reduceMotion, to, value]);
  return <motion.span className={className}>{text}</motion.span>;
}

function ScoreRing({ correct, total }: { correct: number; total: number }) {
  const reduceMotion = useReducedMotion();
  const r = 52;
  const c = 2 * Math.PI * r;
  const fraction = total === 0 ? 0 : correct / total;
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-slate)" strokeWidth="10" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="var(--color-beam)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduceMotion ? c * (1 - fraction) : c }}
          animate={{ strokeDashoffset: c * (1 - fraction) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular text-3xl font-semibold">
          {correct}/{total}
        </span>
        <span className="text-xs text-ink-muted">correct</span>
      </div>
    </div>
  );
}

function nextStep(accuracy: number) {
  if (accuracy < 0.6) return "Read through the explanations below, then try this topic again at Foundation level.";
  if (accuracy >= 0.85) return "Strong result. Try Challenge questions on this topic next.";
  return "Good progress. Another quiz on this topic soon will help it stick.";
}

export function QuizResults({
  topicId,
  topicName,
  summary,
  questions,
  results,
  historical = false,
}: {
  topicId: string | null;
  topicName: string;
  summary: QuizSummary;
  questions: PlayerQuestion[];
  results: Record<string, QuestionResult>;
  /** Re-opened later from history: the XP breakdown isn't stored, only the total. */
  historical?: boolean;
}) {
  const missed = questions.filter((q) => results[q.id] && !results[q.id]!.isCorrect);
  const xpRows = [
    { label: "Correct answers", value: summary.xp.correctAnswers },
    { label: "Quiz completed", value: summary.xp.completion },
    { label: "Perfect score", value: summary.xp.perfect },
    { label: "New personal best", value: summary.xp.personalBest },
  ].filter((row) => row.value > 0);

  return (
    <div className="mx-auto max-w-2xl">
      <section aria-labelledby="results-heading" className="animate-enter rounded-xl border border-line bg-deep p-6 sm:p-8">
        <h1 id="results-heading" className="text-2xl font-semibold">
          {topicName}: results
        </h1>
        <div className="mt-6 flex flex-col items-center gap-8 sm:flex-row sm:items-center">
          <ScoreRing correct={summary.correct} total={summary.answered} />
          <dl className="grid w-full grid-cols-2 gap-px overflow-hidden rounded-lg bg-line">
            <div className="bg-deep p-4">
              <dt className="text-sm text-ink-muted">Accuracy</dt>
              <dd className="tabular mt-1 text-2xl font-semibold">{Math.round(summary.accuracy * 100)}%</dd>
            </div>
            <div className="bg-deep p-4">
              <dt className="text-sm text-ink-muted">XP earned</dt>
              <dd className="tabular mt-1 text-2xl font-semibold text-beam-bright">
                +<CountUp to={summary.xp.total} />
              </dd>
            </div>
          </dl>
        </div>

        {xpRows.length > 0 && (
          <ul className="mt-6 space-y-1.5 text-sm">
            {xpRows.map((row, i) => (
              <li
                key={row.label}
                className="flex animate-enter-soft justify-between text-ink-soft"
                style={{ animationDelay: `${400 + i * 90}ms` }}
              >
                <span>{row.label}</span>
                <span className="tabular">+{row.value}</span>
              </li>
            ))}
          </ul>
        )}
        {!historical && summary.xp.capped > 0 && (
          <p className="mt-3 text-sm text-ink-muted">
            You&apos;ve reached today&apos;s XP limit for solo practice, so {summary.xp.capped} XP wasn&apos;t added. Your answers still count
            towards your progress.
          </p>
        )}
        {!historical &&
          summary.xp.total > 0 &&
          summary.xp.correctAnswers < summary.correct * XP_RULES.correctAnswer && (
            <p className="mt-3 text-sm text-ink-muted">
              Questions you&apos;d already got right in the last 24 hours don&apos;t earn answer XP again, so new questions are
              worth more than repeats.
            </p>
          )}
        {!historical && summary.xp.total === 0 && summary.xp.capped === 0 && (
          <p className="mt-3 text-sm text-ink-muted">
            No XP this time: you&apos;d already earned it for these questions today. Your answers still count towards your progress.
          </p>
        )}

        {summary.newAchievements.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2" role="status">
            {summary.newAchievements.map((id, i) => (
              <motion.span
                key={id}
                initial={{ opacity: 0, scale: 0.9, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 24, delay: 0.8 + i * 0.12 }}
                className="inline-flex items-center gap-2 rounded-full bg-beam-wash px-3 py-1.5 text-sm text-beam-bright"
              >
                <Award className="h-4 w-4" aria-hidden />
                Achievement unlocked: {ACHIEVEMENT_NAMES[id] ?? id}
              </motion.span>
            ))}
          </div>
        )}

        <p className="mt-6 border-t border-line pt-5 text-ink-soft">{nextStep(summary.accuracy)}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonLink href={topicId ? `/quizzes?topic=${topicId}` : "/quizzes"}>Practise this topic again</ButtonLink>
          <ButtonLink href="/dashboard" variant="secondary">
            Back to dashboard
          </ButtonLink>
        </div>
      </section>

      {missed.length > 0 && (
        <section aria-labelledby="review-heading" className="mt-10 animate-enter [animation-delay:200ms]">
          <h2 id="review-heading" className="text-lg font-semibold">
            Review what you missed
          </h2>
          <ul className="mt-4 space-y-3">
            {missed.map((q) => {
              const r = results[q.id]!;
              const yours = q.options?.find((o) => o.id === r.submitted)?.text ?? r.submitted;
              const right = q.type === "short_answer" ? r.acceptedAnswer : q.options?.find((o) => o.id === r.correctOption)?.text;
              return (
                <li key={q.id} className="rounded-xl bg-paper p-5 text-paper-ink">
                  <p className="font-semibold">{q.text}</p>
                  <p className="mt-2 flex items-start gap-2 text-sm">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-incorrect" aria-hidden /> <span>Your answer: {yours}</span>
                  </p>
                  {right && (
                    <p className="mt-1 flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-correct" aria-hidden /> <span>Correct answer: {right}</span>
                    </p>
                  )}
                  {r.explanation && <p className="mt-2 text-sm text-paper-ink-soft">{r.explanation}</p>}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
