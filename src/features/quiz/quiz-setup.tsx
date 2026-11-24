"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { useActionState, useMemo, useState, type ReactNode } from "react";
import { SubjectIcon } from "@/components/subject-icon";
import { FormAlert, SubmitButton } from "@/components/ui/form";
import { Segmented } from "@/components/ui/segmented";
import { subjectStyle } from "@/config/subject-theme";
import { cn } from "@/lib/cn";
import { startQuiz, type StartQuizState } from "./actions";

export interface SetupTopic {
  id: string;
  name: string;
  description: string | null;
  questionCount: number;
  multipleChoiceCount: number;
  /** Recent accuracy 0–1, once the student has practised it. */
  accuracy: number | null;
}
export interface SetupSubject {
  id: string;
  slug: string;
  name: string;
  isMine: boolean;
  topics: SetupTopic[];
}

const EASE = [0.22, 1, 0.36, 1] as const;
const DIFFICULTY_CHOICES = [
  { value: "mixed", label: "Mixed" },
  { value: "foundation", label: "Foundation" },
  { value: "standard", label: "Standard" },
  { value: "challenge", label: "Challenge" },
] as const;
const TYPE_CHOICES = [
  { value: "all", label: "All question types" },
  { value: "multiple_choice", label: "Multiple choice only" },
] as const;
const LENGTHS = [5, 8, 10] as const;

function StepHeading({ n, children, id }: { n: number; children: ReactNode; id: string }) {
  return (
    <h2 id={id} className="flex items-center gap-3 text-lg font-semibold">
      <span className="tabular flex h-7 w-7 items-center justify-center rounded-full bg-beam-wash text-sm text-beam-bright" aria-hidden>
        {n}
      </span>
      {children}
    </h2>
  );
}

export function QuizSetup({ subjects, initialTopicId }: { subjects: SetupSubject[]; initialTopicId?: string }) {
  const reduceMotion = useReducedMotion();
  const [state, action] = useActionState<StartQuizState, FormData>(startQuiz, {});
  const usable = useMemo(() => subjects.filter((s) => s.topics.length > 0), [subjects]);
  const initialSubject =
    usable.find((s) => s.topics.some((t) => t.id === initialTopicId)) ?? usable.find((s) => s.isMine) ?? usable[0];
  const [subjectId, setSubjectId] = useState(initialSubject?.id ?? "");
  const [topicId, setTopicId] = useState(
    initialSubject?.topics.find((t) => t.id === initialTopicId)?.id ?? initialSubject?.topics[0]?.id ?? "",
  );
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTY_CHOICES)[number]["value"]>("mixed");
  const [types, setTypes] = useState<(typeof TYPE_CHOICES)[number]["value"]>("all");
  const [length, setLength] = useState<(typeof LENGTHS)[number]>(8);

  const subject = usable.find((s) => s.id === subjectId);
  const topic = subject?.topics.find((t) => t.id === topicId);
  const available = topic ? (types === "multiple_choice" ? topic.multipleChoiceCount : topic.questionCount) : 0;
  const willGet = Math.min(length, available);

  function chooseSubject(id: string) {
    setSubjectId(id);
    const next = usable.find((s) => s.id === id);
    if (next && !next.topics.some((t) => t.id === topicId)) setTopicId(next.topics[0]?.id ?? "");
  }

  return (
    <form action={action} className="space-y-12">
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}

      <section aria-labelledby="step-subject">
        <StepHeading n={1} id="step-subject">
          Choose a subject
        </StepHeading>
        <div role="radiogroup" aria-labelledby="step-subject" className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {usable.map((s) => {
            const active = s.id === subjectId;
            return (
              <label
                key={s.id}
                style={subjectStyle(s.slug)}
                className={cn(
                  "group relative flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-[background-color,border-color,transform] duration-200 active:scale-[0.98] sm:p-4",
                  active ? "subject-ring border-transparent bg-slate" : "border-line bg-deep hover:border-line-strong hover:bg-slate/60",
                )}
              >
                <input
                  type="radio"
                  name="subject"
                  value={s.id}
                  checked={active}
                  onChange={() => chooseSubject(s.id)}
                  className="peer sr-only"
                />
                <span className="subject-chip flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                  <SubjectIcon slug={s.slug} className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.9375rem] leading-tight font-medium">{s.name}</span>
                  <span className="block text-xs text-ink-muted">
                    {s.topics.length} topics{s.isMine ? ", yours" : ""}
                  </span>
                </span>
                <span className="pointer-events-none absolute inset-0 rounded-xl peer-focus-visible:ring-2 peer-focus-visible:ring-beam" aria-hidden />
              </label>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="step-topic">
        <StepHeading n={2} id="step-topic">
          Choose a topic
        </StepHeading>
        <div className="mt-4" style={subject ? subjectStyle(subject.slug) : undefined}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={subjectId}
              role="radiogroup"
              aria-labelledby="step-topic"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="grid gap-2.5 sm:grid-cols-2"
            >
              {subject?.topics.map((t) => {
                const active = t.id === topicId;
                return (
                  <label
                    key={t.id}
                    className={cn(
                      "group relative flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors duration-200",
                      active ? "subject-ring border-transparent bg-slate" : "border-line bg-deep hover:border-line-strong hover:bg-slate/60",
                    )}
                  >
                    <input
                      type="radio"
                      name="topicId"
                      value={t.id}
                      checked={active}
                      onChange={() => setTopicId(t.id)}
                      className="peer sr-only"
                    />
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                        active ? "subject-fill border-transparent text-night" : "border-line-strong",
                      )}
                      aria-hidden
                    >
                      {active && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{t.name}</span>
                      {t.description && <span className="mt-0.5 block text-sm leading-snug text-ink-muted">{t.description}</span>}
                      <span className="mt-3 flex items-center gap-2 text-xs text-ink-soft">
                        {t.accuracy === null ? (
                          <span>New to you</span>
                        ) : (
                          <>
                            <span className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-raised" aria-hidden>
                              <span className="subject-fill block h-full rounded-full" style={{ width: `${Math.round(t.accuracy * 100)}%` }} />
                            </span>
                            <span className="tabular">{Math.round(t.accuracy * 100)}% recently</span>
                          </>
                        )}
                      </span>
                    </span>
                    <span className="pointer-events-none absolute inset-0 rounded-xl peer-focus-visible:ring-2 peer-focus-visible:ring-beam" aria-hidden />
                  </label>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <section aria-labelledby="step-options">
        <StepHeading n={3} id="step-options">
          Set up your quiz
        </StepHeading>
        <div className="mt-4 grid gap-6 rounded-xl border border-line bg-deep p-5 sm:p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <Segmented name="difficulty" legend="Difficulty" choices={DIFFICULTY_CHOICES} value={difficulty} onChange={setDifficulty} />
          </div>
          <Segmented name="types" legend="Questions" choices={TYPE_CHOICES} value={types} onChange={setTypes} />
          <Segmented
            name="length"
            legend="Length"
            choices={LENGTHS.map((n) => ({ value: n, label: String(n) }))}
            value={length}
            onChange={setLength}
          />
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-soft" aria-live="polite">
            {topic ? (
              available < 3 ? (
                <>This topic doesn&apos;t have enough of those questions yet. Choose All question types.</>
              ) : (
                <>
                  <span className="tabular font-medium text-ink">{willGet}</span> questions on{" "}
                  <span className="font-medium text-ink">{topic.name}</span>
                  {willGet < length ? ` (all ${available} available)` : ""}
                </>
              )
            ) : (
              "Choose a topic to start."
            )}
          </p>
          <SubmitButton pendingLabel="Starting…" size="lg" className="w-full sm:w-auto" disabled={!topic || available < 3}>
            Start quiz <ArrowRight className="h-4 w-4" aria-hidden />
          </SubmitButton>
        </div>
      </section>
    </form>
  );
}
