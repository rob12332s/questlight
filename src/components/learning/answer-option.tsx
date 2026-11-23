"use client";

import { Check, X } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import type { AnswerOption as Option } from "@/domain/types";

export type OptionState = "idle" | "selected" | "correct" | "incorrect" | "missed" | "dimmed";

/**
 * One answer on a paper card. Correctness is never shown by colour alone:
 * every state also changes the icon and the accessible label.
 */
export function AnswerOption({
  option,
  state,
  disabled,
  onSelect,
}: {
  option: Option;
  state: OptionState;
  disabled: boolean;
  onSelect: (id: Option["id"]) => void;
}) {
  const verdict =
    state === "correct"
      ? "Your answer, correct"
      : state === "incorrect"
        ? "Your answer, incorrect"
        : state === "missed"
          ? "Correct answer"
          : null;

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(option.id)}
      aria-pressed={state === "selected" || state === "correct" || state === "incorrect"}
      animate={state === "incorrect" ? { x: [0, -4, 4, -2, 0] } : { x: 0 }}
      transition={{ duration: 0.32 }}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors duration-150 sm:px-4",
        "disabled:cursor-default",
        state === "idle" && "border-paper-line bg-white hover:border-paper-ink-soft/40",
        state === "selected" && "border-beam-deep bg-white shadow-[0_0_0_1px_var(--color-beam-deep)]",
        state === "correct" && "border-correct bg-correct-wash",
        state === "incorrect" && "border-incorrect bg-incorrect-wash",
        state === "missed" && "border-correct border-dashed bg-white",
        state === "dimmed" && "border-paper-line bg-white opacity-55",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm font-semibold",
          state === "correct" || state === "missed"
            ? "bg-correct text-white"
            : state === "incorrect"
              ? "bg-incorrect text-white"
              : state === "selected"
                ? "bg-beam-deep text-white"
                : "bg-paper text-paper-ink-soft group-hover:text-paper-ink",
        )}
        aria-hidden
      >
        {state === "correct" || state === "missed" ? (
          <Check className="h-4 w-4" strokeWidth={2.5} />
        ) : state === "incorrect" ? (
          <X className="h-4 w-4" strokeWidth={2.5} />
        ) : (
          option.id
        )}
      </span>
      <span className="flex-1 text-[0.9375rem] text-paper-ink sm:text-base">{option.text}</span>
      {verdict && (
        <span
          className={cn(
            "text-xs font-medium",
            state === "incorrect" ? "text-incorrect" : "text-correct",
          )}
        >
          {state === "incorrect" ? "Not quite" : state === "correct" ? "Correct" : "Answer"}
          <span className="sr-only">: {verdict}</span>
        </span>
      )}
    </motion.button>
  );
}
