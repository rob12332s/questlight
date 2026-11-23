"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/cn";

const LEVELS = [
  {
    id: "simpler",
    label: "Simpler",
    text: "Particles are always moving and bumping into each other. Over time they spread out from where there are lots of them to where there are fewer, like a smell spreading across a room.",
  },
  {
    id: "gcse",
    label: "GCSE",
    text: "Diffusion is the net movement of particles from an area of higher concentration to an area of lower concentration. It is passive, so it needs no energy from respiration.",
  },
  {
    id: "stretch",
    label: "Stretch",
    text: "Diffusion is faster with a steeper concentration gradient, a shorter diffusion distance and a larger surface area. Alveoli have all three: a rich blood supply, walls one cell thick, and millions of them in each lung.",
  },
] as const;

type LevelId = (typeof LEVELS)[number]["id"];

/**
 * Shows how one idea can be explained at three levels. The text is written by the
 * team as an illustration — it is labelled as such and is not AI output.
 */
export function ExplanationLevels() {
  const [level, setLevel] = useState<LevelId>("gcse");
  const reduceMotion = useReducedMotion();
  const current = LEVELS.find((l) => l.id === level)!;

  return (
    <div className="rounded-xl bg-paper p-5 text-paper-ink shadow-paper sm:p-6">
      <p className="text-sm text-paper-ink-soft">
        <span className="font-semibold text-paper-ink">Biology</span>
        <span className="mx-2 text-paper-line" aria-hidden>
          /
        </span>
        What is diffusion?
      </p>

      <div role="tablist" aria-label="Explanation level" className="mt-4 inline-flex rounded-lg bg-white p-1 shadow-[inset_0_0_0_1px_var(--color-paper-line)]">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            id={`level-tab-${l.id}`}
            aria-selected={level === l.id}
            aria-controls="level-panel"
            onClick={() => setLevel(l.id)}
            className={cn(
              "relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              level === l.id ? "text-paper" : "text-paper-ink-soft hover:text-paper-ink",
            )}
          >
            {level === l.id && (
              <motion.span
                layoutId={reduceMotion ? undefined : "level-pill"}
                className="absolute inset-0 rounded-md bg-paper-ink"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative">{l.label}</span>
          </button>
        ))}
      </div>

      <div id="level-panel" role="tabpanel" aria-labelledby={`level-tab-${level}`} className="mt-4 min-h-[7.5rem]">
        <motion.p
          key={level}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="text-[0.9375rem] leading-relaxed text-paper-ink"
        >
          {current.text}
        </motion.p>
      </div>
      <p className="mt-3 border-t border-paper-line pt-3 text-xs text-paper-ink-soft">
        Example written by our team. In the app, AI-written explanations are always labelled and can be reported.
      </p>
    </div>
  );
}
