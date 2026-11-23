/**
 * Multiplayer scoring rules.
 *
 * The database function `submit_game_answer` is the authority; this module mirrors it
 * exactly so the UI can explain scores and so the formula is unit tested.
 * Any change here MUST be made in supabase/migrations as well (a parity test checks both).
 *
 *   correct   → 100 base points + speed bonus (0–50)
 *   incorrect → 0 points
 *   late / not answered → 0 points
 *
 * Because the maximum bonus (50) is half the base (100), two correct answers always beat
 * one fast correct answer: accuracy matters more than speed.
 */
export const SCORING_RULES = {
  basePoints: 100,
  maxSpeedBonus: 50,
} as const;

export interface RoundTiming {
  /** Server time the round opened (ms since epoch). */
  startedAtMs: number;
  /** Server time after which answers are rejected (ms since epoch). */
  deadlineAtMs: number;
}

export type RoundScore =
  | { accepted: true; isCorrect: boolean; basePoints: number; speedBonus: number; total: number }
  | { accepted: false; reason: "before_start" | "after_deadline" | "invalid_timing"; total: 0 };

export function speedBonus(submittedAtMs: number, timing: RoundTiming): number {
  const window = timing.deadlineAtMs - timing.startedAtMs;
  if (window <= 0) return 0;
  const remaining = Math.min(Math.max(timing.deadlineAtMs - submittedAtMs, 0), window);
  return Math.floor((SCORING_RULES.maxSpeedBonus * remaining) / window);
}

export function scoreRoundAnswer(isCorrect: boolean, submittedAtMs: number, timing: RoundTiming): RoundScore {
  if (!(timing.deadlineAtMs > timing.startedAtMs)) return { accepted: false, reason: "invalid_timing", total: 0 };
  if (submittedAtMs < timing.startedAtMs) return { accepted: false, reason: "before_start", total: 0 };
  if (submittedAtMs > timing.deadlineAtMs) return { accepted: false, reason: "after_deadline", total: 0 };

  if (!isCorrect) return { accepted: true, isCorrect: false, basePoints: 0, speedBonus: 0, total: 0 };

  const bonus = speedBonus(submittedAtMs, timing);
  return {
    accepted: true,
    isCorrect: true,
    basePoints: SCORING_RULES.basePoints,
    speedBonus: bonus,
    total: SCORING_RULES.basePoints + bonus,
  };
}

export interface RankedPlayer {
  playerId: string;
  displayName: string;
  score: number;
  correctCount: number;
  /** Total ms taken across correct answers — used only to break exact ties. */
  totalCorrectAnswerMs: number;
}

/**
 * Standard competition ranking ("1, 2, 2, 4"). Ties broken by correct answers, then
 * by total answer time, and only then share a rank.
 */
export function rankPlayers<T extends RankedPlayer>(players: readonly T[]): Array<T & { rank: number }> {
  const sorted = [...players].sort(
    (a, b) =>
      b.score - a.score ||
      b.correctCount - a.correctCount ||
      a.totalCorrectAnswerMs - b.totalCorrectAnswerMs ||
      a.displayName.localeCompare(b.displayName),
  );
  let lastRank = 0;
  return sorted.map((player, index) => {
    const prev = sorted[index - 1];
    const tied =
      prev !== undefined &&
      prev.score === player.score &&
      prev.correctCount === player.correctCount &&
      prev.totalCorrectAnswerMs === player.totalCorrectAnswerMs;
    const rank = tied ? lastRank : index + 1;
    lastRank = rank;
    return { ...player, rank };
  });
}
