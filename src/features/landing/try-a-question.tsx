"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { RotateCcw } from "lucide-react";
import { useId, useState, type KeyboardEvent } from "react";
import { AnswerOption, type OptionState } from "@/components/learning/answer-option";
import type { OptionId } from "@/domain/types";
import { SAMPLE_QUESTIONS } from "./sample-questions";

const KEY_TO_OPTION: Record<string, OptionId> = { "1": "A", "2": "B", "3": "C", "4": "D", a: "A", b: "B", c: "C", d: "D" };

/**
 * The hero: a real question on paper that visitors can answer straight away.
 * This is the one orchestrated motion moment on the page — a beam of light crosses
 * the card when you get it right.
 */
export function TryAQuestion() {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<OptionId | null>(null);
  const reduceMotion = useReducedMotion();
  const headingId = useId();
  const question = SAMPLE_QUESTIONS[index % SAMPLE_QUESTIONS.length]!;
  const answered = chosen !== null;
  const isCorrect = chosen === question.correct;

  function stateFor(id: OptionId): OptionState {
    if (!answered) return "idle";
    if (id === chosen) return id === question.correct ? "correct" : "incorrect";
    if (id === question.correct) return "missed";
    return "dimmed";
  }

  function next() {
    setChosen(null);
    setIndex((value) => value + 1);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (answered || event.metaKey || event.ctrlKey || event.altKey) return;
    const option = KEY_TO_OPTION[event.key.toLowerCase()];
    if (option && question.options.some((o) => o.id === option)) {
      event.preventDefault();
      setChosen(option);
    }
  }

  return (
    <section
      aria-labelledby={headingId}
      onKeyDown={onKeyDown}
      className="relative overflow-hidden rounded-xl bg-paper p-5 text-paper-ink shadow-paper sm:p-7"
    >
      {answered && isCorrect && !reduceMotion && (
        <span
          key={`beam-${index}`}
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-full animate-beam-sweep bg-[linear-gradient(100deg,transparent_20%,rgb(123_134_255/0.22)_50%,transparent_80%)]"
        />
      )}

      <div className="flex items-center justify-between gap-4 text-sm">
        <p className="text-paper-ink-soft">
          <span className="font-semibold text-paper-ink">{question.subject}</span>
          <span className="mx-2 text-paper-line" aria-hidden>
            /
          </span>
          {question.topic}
        </p>
        <span className="rounded-sm bg-white px-2 py-0.5 text-xs text-paper-ink-soft shadow-[inset_0_0_0_1px_var(--color-paper-line)]">
          Sample question
        </span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 id={headingId} className="mt-4 text-xl leading-snug font-semibold tracking-[-0.015em] sm:text-[1.375rem]">
            {question.text}
          </h2>

          <div className="mt-5 grid gap-2" role="group" aria-label="Answer options">
            {question.options.map((option) => (
              <AnswerOption
                key={option.id}
                option={option}
                state={stateFor(option.id)}
                disabled={answered}
                onSelect={setChosen}
              />
            ))}
          </div>

          <div aria-live="polite">
            <AnimatePresence initial={false}>
              {answered && (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-5 border-t border-paper-line pt-4">
                    <p className="font-semibold">{isCorrect ? "That's right." : "Not this time."}</p>
                    <p className="mt-1 text-[0.9375rem] text-paper-ink-soft">{question.explanation}</p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-paper-ink-soft">
                        In the app, this answer feeds your {question.topic.toLowerCase()} accuracy.
                      </p>
                      <button
                        type="button"
                        onClick={next}
                        className="inline-flex h-9 items-center gap-2 rounded-md bg-paper-ink px-3 text-sm font-medium text-paper hover:bg-black"
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden />
                        Try another
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>

    </section>
  );
}
