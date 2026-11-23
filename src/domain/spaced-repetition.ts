/**
 * Flashcard scheduling — a simplified SM-2 style scheduler.
 *
 *   needs practice → see it again in about 10 minutes (and later in this session)
 *   learning       → about a day, growing slowly
 *   confident      → several days, growing by the card's "ease"
 *
 * Viewing or flipping a card never changes its schedule; only a rating does.
 */
export const RATINGS = ["needs_practice", "learning", "confident"] as const;
export type Rating = (typeof RATINGS)[number];

export const RATING_LABELS: Record<Rating, string> = {
  needs_practice: "Need more practice",
  learning: "Learning",
  confident: "Confident",
};

export interface CardSchedule {
  intervalDays: number;
  ease: number;
  reviewCount: number;
  dueAt: Date;
}

export const SR_LIMITS = { minEase: 1.3, maxEase: 3.0, startEase: 2.5, maxIntervalDays: 365 } as const;
const TEN_MINUTES_IN_DAYS = 10 / (24 * 60);

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function scheduleReview(
  previous: Pick<CardSchedule, "intervalDays" | "ease" | "reviewCount"> | null,
  rating: Rating,
  now: Date = new Date(),
): CardSchedule {
  const ease = previous?.ease ?? SR_LIMITS.startEase;
  const interval = previous?.intervalDays ?? 0;
  let nextInterval: number;
  let nextEase: number;

  switch (rating) {
    case "needs_practice":
      nextInterval = TEN_MINUTES_IN_DAYS;
      nextEase = ease - 0.2;
      break;
    case "learning":
      nextInterval = previous ? Math.max(1, interval * 1.2) : 1;
      nextEase = ease - 0.05;
      break;
    case "confident":
      nextInterval = previous ? Math.max(3, interval * ease) : 3;
      nextEase = ease + 0.1;
      break;
  }

  const exactInterval = clamp(nextInterval, TEN_MINUTES_IN_DAYS, SR_LIMITS.maxIntervalDays);
  return {
    // Stored to 2 decimal places (the database column); the due date uses the exact value.
    intervalDays: round2(exactInterval),
    ease: round2(clamp(nextEase, SR_LIMITS.minEase, SR_LIMITS.maxEase)),
    reviewCount: (previous?.reviewCount ?? 0) + 1,
    dueAt: new Date(now.getTime() + exactInterval * 24 * 60 * 60 * 1000),
  };
}

/** Cards to study now: never-reviewed first, then the most overdue. */
export function studyOrder<T extends { id: string; dueAt: Date | null; createdAt: Date }>(cards: readonly T[], now: Date = new Date()): T[] {
  return cards
    .filter((c) => c.dueAt === null || c.dueAt.getTime() <= now.getTime())
    .sort((a, b) => {
      if (a.dueAt === null && b.dueAt === null) return a.createdAt.getTime() - b.createdAt.getTime();
      if (a.dueAt === null) return -1;
      if (b.dueAt === null) return 1;
      return a.dueAt.getTime() - b.dueAt.getTime();
    });
}
