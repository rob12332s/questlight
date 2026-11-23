"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect } from "react";
import type { LevelProgress as Progress } from "@/domain/progression";

/** Level and XP bar. The bar fills and the XP number counts up when it first appears. */
export function LevelProgress({ progress, totalXp }: { progress: Progress; totalXp: number }) {
  const reduceMotion = useReducedMotion();
  const xp = useMotionValue(reduceMotion ? totalXp : 0);
  const rounded = useTransform(xp, (v) => Math.round(v).toLocaleString("en-GB"));

  useEffect(() => {
    if (reduceMotion) {
      xp.set(totalXp);
      return;
    }
    const controls = animate(xp, totalXp, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [reduceMotion, totalXp, xp]);

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">Level</p>
          <p className="tabular text-4xl font-semibold">{progress.level}</p>
        </div>
        <p className="tabular text-right text-sm text-ink-soft">
          <motion.span>{rounded}</motion.span> XP
        </p>
      </div>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-slate"
        role="progressbar"
        aria-label={`Progress to level ${progress.level + 1}`}
        aria-valuemin={0}
        aria-valuemax={progress.xpForNextLevel}
        aria-valuenow={progress.xpIntoLevel}
      >
        <motion.div
          className="h-full origin-left rounded-full bg-beam"
          initial={{ scaleX: reduceMotion ? progress.progress : 0 }}
          animate={{ scaleX: progress.progress }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <p className="tabular mt-2 text-sm text-ink-muted">
        {progress.isMaxLevel
          ? "Top level reached"
          : `${progress.xpForNextLevel - progress.xpIntoLevel} XP to level ${progress.level + 1}`}
      </p>
    </div>
  );
}
