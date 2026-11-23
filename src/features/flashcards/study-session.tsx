"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Award, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { RATING_LABELS, RATINGS, type Rating } from "@/domain/spaced-repetition";
import { cn } from "@/lib/cn";
import { rateCard } from "./actions";

interface StudyCard {
  id: string;
  front: string;
  back: string;
  explanation: string | null;
}

const EASE = [0.22, 1, 0.36, 1] as const;
const RATING_STYLE: Record<Rating, string> = {
  needs_practice: "border-incorrect/50 hover:bg-incorrect/10",
  learning: "border-caution/50 hover:bg-caution/10",
  confident: "border-correct/50 hover:bg-correct/10",
};
const ACHIEVEMENT_NAMES: Record<string, string> = {
  deck_builder: "Deck builder",
  steady_recall: "Steady recall",
  streak_3: "Three in a row",
  streak_7: "Full week",
};

/**
 * Review session. Flip a card (click, Space or Enter), then rate it (1, 2, 3).
 * Cards rated "need more practice" return at the end of this session too.
 */
export function StudySession({ deckId, cards }: { deckId: string; cards: StudyCard[] }) {
  const reduceMotion = useReducedMotion();
  const [queue, setQueue] = useState<StudyCard[]>(cards);
  const [flipped, setFlipped] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [tally, setTally] = useState<Record<Rating, number>>({ needs_practice: 0, learning: 0, confident: 0 });
  const [achievements, setAchievements] = useState<string[]>([]);
  const card = queue[0];
  const reviewed = tally.needs_practice + tally.learning + tally.confident;

  const rate = useCallback(
    async (rating: Rating) => {
      if (!card || !flipped || saving) return;
      setSaving(true);
      setError(false);
      const r = await rateCard(card.id, rating);
      setSaving(false);
      if (!r.ok) {
        setError(true);
        return;
      }
      if (r.achievements?.length) setAchievements((a) => [...a, ...r.achievements!]);
      setTally((t) => ({ ...t, [rating]: t[rating] + 1 }));
      setFlipped(false);
      setQueue((q) => {
        const [current, ...rest] = q;
        // Struggling cards come back at the end of this session.
        return rating === "needs_practice" && current ? [...rest, current] : rest;
      });
    },
    [card, flipped, saving],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === " " || event.key === "Enter") {
        if (!flipped) {
          event.preventDefault();
          setFlipped(true);
        }
        return;
      }
      const index = ["1", "2", "3"].indexOf(event.key);
      if (index >= 0 && flipped) {
        event.preventDefault();
        void rate(RATINGS[index]!);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, rate]);

  if (!card) {
    return (
      <div className="mx-auto max-w-xl animate-enter rounded-xl border border-line bg-deep p-8 text-center">
        <h2 className="text-2xl font-semibold">Review done</h2>
        <p className="tabular mt-2 text-ink-soft">
          {reviewed} {reviewed === 1 ? "rating" : "ratings"}: {tally.confident} confident, {tally.learning} learning, {tally.needs_practice} need
          more practice.
        </p>
        {achievements.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2" role="status">
            {achievements.map((id) => (
              <span key={id} className="inline-flex items-center gap-2 rounded-full bg-beam-wash px-3 py-1.5 text-sm text-beam-bright">
                <Award className="h-4 w-4" aria-hidden /> Achievement unlocked: {ACHIEVEMENT_NAMES[id] ?? id}
              </span>
            ))}
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href={`/flashcards/${deckId}`}>Back to deck</ButtonLink>
          <ButtonLink href="/flashcards" variant="secondary">
            All decks
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="tabular text-sm text-ink-soft" aria-live="polite">
        {queue.length} {queue.length === 1 ? "card" : "cards"} left
      </p>

      <div className="mt-4 [perspective:1400px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${card.id}-${reviewed}`}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: EASE }}
          >
            <motion.button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              aria-label={flipped ? "Showing answer. Click to see the question again." : "Showing question. Click to reveal the answer."}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.55, ease: EASE }}
              className="relative block min-h-[17rem] w-full cursor-pointer rounded-xl text-left [transform-style:preserve-3d] focus-visible:outline-offset-4"
            >
              <span className="absolute inset-0 flex flex-col rounded-xl bg-paper p-7 text-paper-ink shadow-paper [backface-visibility:hidden]">
                <span className="text-xs text-paper-ink-soft">Question</span>
                <span className="mt-3 flex flex-1 items-center text-xl leading-snug font-semibold">{card.front}</span>
                <span className="text-xs text-paper-ink-soft">Tap or press Space to flip</span>
              </span>
              <span className="absolute inset-0 flex flex-col rounded-xl bg-white p-7 text-paper-ink shadow-paper [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <span className="text-xs text-paper-ink-soft">Answer</span>
                <span className="mt-3 text-xl leading-snug font-semibold">{card.back}</span>
                {card.explanation && <span className="mt-3 text-[0.9375rem] text-paper-ink-soft">{card.explanation}</span>}
              </span>
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 min-h-[5.5rem]">
        <AnimatePresence>
          {flipped && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
            >
              <p className="text-sm text-ink-soft">How well did you know it?</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {RATINGS.map((rating, i) => (
                  <button
                    key={rating}
                    type="button"
                    disabled={saving}
                    onClick={() => void rate(rating)}
                    className={cn(
                      "flex h-12 flex-col items-center justify-center rounded-lg border text-sm font-medium transition-[background-color,transform] duration-200 active:scale-[0.97] disabled:opacity-50",
                      RATING_STYLE[rating],
                    )}
                  >
                    {RATING_LABELS[rating]}
                    <span className="text-[0.6875rem] font-normal text-ink-muted">Press {i + 1}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {error && (
          <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-incorrect">
            <RotateCcw className="h-4 w-4" aria-hidden /> That rating didn&apos;t save. Try again.
          </p>
        )}
      </div>
    </div>
  );
}
