"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Flag, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { AnswerOption, type OptionState } from "@/components/learning/answer-option";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form";
import { DIFFICULTY_LABELS, type OptionId } from "@/domain/types";
import { cn } from "@/lib/cn";
import { completeQuiz, reportQuestion, submitAnswer, type QuizSummary } from "./actions";
import { QuizResults } from "./quiz-results";
import type { PlayerQuestion, QuestionResult } from "./types";

const EASE = [0.22, 1, 0.36, 1] as const;
const KEY_TO_OPTION: Record<string, OptionId> = { "1": "A", "2": "B", "3": "C", "4": "D" };

export function QuizPlayer({
  sessionId,
  topicId,
  topicName,
  subjectName,
  questions,
  initialResults,
}: {
  sessionId: string;
  topicId: string | null;
  topicName: string;
  subjectName: string;
  questions: PlayerQuestion[];
  initialResults: Record<string, QuestionResult>;
}) {
  const reduceMotion = useReducedMotion();
  const [results, setResults] = useState<Record<string, QuestionResult>>(initialResults);
  // Resume at the first unanswered question.
  const [index, setIndex] = useState(() => {
    const i = questions.findIndex((q) => !initialResults[q.id]);
    return i === -1 ? questions.length - 1 : i;
  });
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<QuizSummary | null>(null);
  const [finishing, setFinishing] = useState(false);
  const nextRef = useRef<HTMLButtonElement>(null);

  const question = questions[index]!;
  const result = results[question.id];
  const answeredCount = Object.keys(results).length;
  const isLast = index === questions.length - 1;
  const allAnswered = answeredCount === questions.length;

  const submit = useCallback(
    async (answer: string) => {
      if (pending || results[question.id]) return;
      setError(null);
      setPending(answer);
      const reveal = await submitAnswer(sessionId, question.id, answer);
      setPending(null);
      if (!reveal.ok) {
        setError(reveal.error);
        return;
      }
      setResults((prev) => ({
        ...prev,
        [question.id]: {
          submitted: answer,
          isCorrect: reveal.isCorrect,
          correctOption: reveal.correctOption,
          acceptedAnswer: reveal.acceptedAnswer,
          explanation: reveal.explanation,
          wrongOptionNotes: reveal.wrongOptionNotes,
        },
      }));
    },
    [pending, question.id, results, sessionId],
  );

  const finish = useCallback(async () => {
    setFinishing(true);
    setError(null);
    const s = await completeQuiz(sessionId);
    setFinishing(false);
    if (!s.ok) {
      setError(s.error);
      return;
    }
    setSummary(s);
  }, [sessionId]);

  const goNext = useCallback(() => {
    if (isLast) void finish();
    else setIndex((i) => i + 1);
  }, [finish, isLast]);

  // Move focus to "Next" after a reveal, so keyboard users can just press Enter.
  useEffect(() => {
    if (result) nextRef.current?.focus({ preventScroll: true });
  }, [result]);

  // Keyboard: 1–4 to answer option questions.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) return;
      const option = KEY_TO_OPTION[event.key];
      if (option && question.options?.some((o) => o.id === option) && !results[question.id]) {
        event.preventDefault();
        void submit(option);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, results, submit]);

  if (summary) {
    return (
      <QuizResults
        topicId={topicId}
        topicName={topicName}
        summary={summary}
        questions={questions}
        results={results}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm text-ink-muted">{subjectName}</p>
          <h1 className="truncate text-xl font-semibold">{topicName}</h1>
        </div>
        <p className="tabular shrink-0 text-sm text-ink-soft" aria-live="polite">
          Question {index + 1} of {questions.length}
        </p>
      </header>

      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate"
        role="progressbar"
        aria-label="Quiz progress"
        aria-valuemin={0}
        aria-valuemax={questions.length}
        aria-valuenow={answeredCount}
      >
        <motion.div
          className="h-full origin-left rounded-full bg-beam"
          initial={false}
          animate={{ scaleX: answeredCount / questions.length }}
          transition={{ duration: 0.5, ease: EASE }}
        />
      </div>

      <div className="relative mt-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={question.id}
            aria-labelledby={`q-${question.id}`}
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -24 }}
            transition={{ duration: 0.26, ease: EASE }}
            className="relative overflow-hidden rounded-xl bg-paper p-5 text-paper-ink shadow-paper sm:p-7"
          >
            {result?.isCorrect && !reduceMotion && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-full animate-beam-sweep bg-[linear-gradient(100deg,transparent_20%,rgb(123_134_255/0.22)_50%,transparent_80%)]"
              />
            )}
            <div className="flex items-center justify-between gap-3 text-xs text-paper-ink-soft">
              <span>{DIFFICULTY_LABELS[question.difficulty]}</span>
              <span>{question.type === "short_answer" ? "Type your answer" : question.type === "true_false" ? "True or false" : "Choose one"}</span>
            </div>
            <h2 id={`q-${question.id}`} className="mt-3 text-xl leading-snug font-semibold tracking-[-0.015em] sm:text-[1.375rem]">
              {question.text}
            </h2>

            {question.type === "short_answer" ? (
              <ShortAnswer result={result} pending={pending !== null} onSubmit={submit} />
            ) : (
              <div className={cn("mt-5 grid gap-2", question.type === "true_false" && "sm:grid-cols-2")} role="group" aria-label="Answer options">
                {question.options!.map((option) => (
                  <AnswerOption
                    key={option.id}
                    option={option}
                    state={optionState(option.id, result, pending)}
                    disabled={Boolean(result) || pending !== null}
                    onSelect={(id) => void submit(id)}
                  />
                ))}
              </div>
            )}

            <div aria-live="polite">
              <AnimatePresence initial={false}>
                {result && (
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <Feedback question={question} result={result} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        </AnimatePresence>
      </div>

      {error && (
        <div className="mt-4">
          <FormAlert tone="error">{error}</FormAlert>
        </div>
      )}

      <div className="mt-6 flex min-h-12 items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">{!result && question.options ? "Tip: press 1–4 to answer" : ""}</p>
        {result && (
          <Button ref={nextRef} size="lg" onClick={goNext} disabled={finishing}>
            {finishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Saving results…
              </>
            ) : isLast ? (
              "See results"
            ) : (
              <>
                Next question <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </Button>
        )}
        {!result && allAnswered && (
          <Button size="lg" onClick={() => void finish()} disabled={finishing}>
            See results
          </Button>
        )}
      </div>
    </div>
  );
}

function optionState(id: string, result: QuestionResult | undefined, pending: string | null): OptionState {
  if (!result) return pending === id ? "selected" : "idle";
  if (id === result.submitted) return result.isCorrect ? "correct" : "incorrect";
  if (id === result.correctOption) return "missed";
  return "dimmed";
}

function ShortAnswer({
  result,
  pending,
  onSubmit,
}: {
  result: QuestionResult | undefined;
  pending: boolean;
  onSubmit: (answer: string) => void;
}) {
  const id = useId();
  const [value, setValue] = useState(result?.submitted ?? "");
  function handle(event: FormEvent) {
    event.preventDefault();
    if (value.trim()) onSubmit(value.trim());
  }
  return (
    <form onSubmit={handle} className="mt-5 flex flex-col gap-2 sm:flex-row">
      <label htmlFor={id} className="sr-only">
        Your answer
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={Boolean(result) || pending}
        maxLength={200}
        autoComplete="off"
        autoFocus
        className={cn(
          "h-12 flex-1 rounded-lg border bg-white px-4 text-base text-paper-ink outline-none transition-colors focus:border-beam-deep focus:ring-2 focus:ring-beam/30",
          result ? (result.isCorrect ? "border-correct bg-correct-wash" : "border-incorrect bg-incorrect-wash") : "border-paper-line",
        )}
        placeholder="Type your answer"
      />
      {!result && (
        <button
          type="submit"
          disabled={pending || !value.trim()}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-paper-ink px-5 font-medium text-paper transition-transform hover:bg-black active:scale-[0.97] disabled:opacity-50"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Check answer
        </button>
      )}
    </form>
  );
}

function Feedback({ question, result }: { question: PlayerQuestion; result: QuestionResult }) {
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState<string | null>(null);
  const [reason, setReason] = useState("incorrect_answer");
  const correctText = useMemo(() => {
    if (question.type === "short_answer") return result.acceptedAnswer ?? null;
    return question.options?.find((o) => o.id === result.correctOption)?.text ?? null;
  }, [question, result]);
  const wrongNote = !result.isCorrect ? result.wrongOptionNotes?.[result.submitted] : undefined;

  async function sendReport() {
    const r = await reportQuestion({ questionId: question.id, reason });
    setReported(r.message);
    setReporting(false);
  }

  return (
    <div className="mt-5 border-t border-paper-line pt-4">
      <p className="flex items-center gap-2 font-semibold">
        {result.isCorrect ? (
          <>
            <Check className="h-5 w-5 text-correct" aria-hidden strokeWidth={2.5} /> Correct
          </>
        ) : (
          <>
            <X className="h-5 w-5 text-incorrect" aria-hidden strokeWidth={2.5} /> Not quite
            {correctText && <span className="font-normal text-paper-ink-soft">. The answer is {correctText}.</span>}
          </>
        )}
      </p>
      {result.explanation && <p className="mt-2 text-[0.9375rem] leading-relaxed text-paper-ink-soft">{result.explanation}</p>}
      {wrongNote && <p className="mt-2 text-[0.9375rem] text-paper-ink-soft">{wrongNote}</p>}

      <div className="mt-3 text-xs text-paper-ink-soft">
        {reported ? (
          <p role="status">{reported}</p>
        ) : reporting ? (
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor={`reason-${question.id}`} className="sr-only">
              What&apos;s wrong?
            </label>
            <select
              id={`reason-${question.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-8 rounded-md border border-paper-line bg-white px-2 text-paper-ink"
            >
              <option value="incorrect_answer">The answer looks wrong</option>
              <option value="unclear">The question is unclear</option>
              <option value="inappropriate">Something inappropriate</option>
              <option value="other">Something else</option>
            </select>
            <button type="button" onClick={() => void sendReport()} className="h-8 rounded-md bg-paper-ink px-3 font-medium text-paper">
              Send report
            </button>
            <button type="button" onClick={() => setReporting(false)} className="h-8 px-2 underline">
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setReporting(true)} className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
            <Flag className="h-3.5 w-3.5" aria-hidden /> Report a problem with this question
          </button>
        )}
      </div>
    </div>
  );
}
