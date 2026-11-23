/**
 * XP, levels and streaks.
 *
 * XP is awarded by the database through an idempotent ledger (`xp_events`, unique per
 * player + source), so the same quiz or game can never pay out twice. This module defines
 * the amounts and the level curve, and decides what a finished activity is worth given
 * facts the server looked up (e.g. which questions were already rewarded today).
 */

export const XP_RULES = {
  /** Per correct answer, first time that question is answered correctly in 24h. */
  correctAnswer: 10,
  /** Completing a solo quiz of at least `minQuizQuestionsForCompletion` questions. */
  quizCompleted: 20,
  /** Bonus for 100% on a quiz of at least `minQuizQuestionsForCompletion` questions. */
  perfectQuiz: 25,
  /** Beating your previous best accuracy on a topic. */
  personalBest: 15,
  multiplayerGameCompleted: 20,
  /** Extra XP for finishing in the top three of a game with at least 2 players. */
  multiplayerPodium: [30, 20, 10] as const,
  minQuizQuestionsForCompletion: 5,
  /** Ceiling on XP earned from solo practice per rolling day, to blunt grinding. */
  dailySoloXpCap: 600,
} as const;

export const MAX_LEVEL = 100;

/** XP needed to go from `level` to `level + 1`. Grows gently so early levels come quickly. */
export function xpForNextLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1) throw new RangeError("level must be a positive integer");
  return 100 + 50 * (level - 1);
}

/** Total XP required to reach `level` from zero. Level 1 starts at 0 XP. */
export function totalXpForLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1) throw new RangeError("level must be a positive integer");
  const n = level - 1;
  return 100 * n + 25 * n * (n - 1);
}

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  /** 0–1 progress toward the next level; 1 at max level. */
  progress: number;
  isMaxLevel: boolean;
}

export function levelFromXp(totalXp: number): LevelProgress {
  const xp = Math.max(0, Math.floor(Number.isFinite(totalXp) ? totalXp : 0));
  let level = 1;
  while (level < MAX_LEVEL && totalXpForLevel(level + 1) <= xp) level += 1;
  if (level === MAX_LEVEL) {
    return { level, xpIntoLevel: xp - totalXpForLevel(MAX_LEVEL), xpForNextLevel: 0, progress: 1, isMaxLevel: true };
  }
  const into = xp - totalXpForLevel(level);
  const needed = xpForNextLevel(level);
  return { level, xpIntoLevel: into, xpForNextLevel: needed, progress: into / needed, isMaxLevel: false };
}

export interface SoloQuizFacts {
  answers: ReadonlyArray<{ questionId: string; isCorrect: boolean; alreadyRewardedToday: boolean }>;
  /** XP the player has already earned from solo practice in the last 24 hours. */
  soloXpEarnedToday: number;
  /** Player's best accuracy (0–1) on this topic before this quiz, or null if none. */
  previousBestAccuracy: number | null;
}

export interface XpBreakdown {
  correctAnswers: number;
  completion: number;
  perfect: number;
  personalBest: number;
  /** Amount removed by the daily cap. */
  capped: number;
  total: number;
}

export function calculateSoloQuizXp(facts: SoloQuizFacts): XpBreakdown {
  const seen = new Set<string>();
  let rewardableCorrect = 0;
  let correct = 0;
  let freshQuestions = 0;

  for (const answer of facts.answers) {
    if (seen.has(answer.questionId)) continue; // duplicates in one quiz never count twice
    seen.add(answer.questionId);
    if (!answer.alreadyRewardedToday) freshQuestions += 1;
    if (answer.isCorrect) {
      correct += 1;
      if (!answer.alreadyRewardedToday) rewardableCorrect += 1;
    }
  }

  const total = seen.size;
  const accuracy = total === 0 ? 0 : correct / total;
  // Completion bonuses need a real quiz with something new in it — repeating the exact
  // same already-rewarded set pays nothing.
  const qualifies = total >= XP_RULES.minQuizQuestionsForCompletion && freshQuestions > 0;

  const breakdown = {
    correctAnswers: rewardableCorrect * XP_RULES.correctAnswer,
    completion: qualifies ? XP_RULES.quizCompleted : 0,
    perfect: qualifies && accuracy === 1 ? XP_RULES.perfectQuiz : 0,
    personalBest:
      qualifies && facts.previousBestAccuracy !== null && accuracy > facts.previousBestAccuracy
        ? XP_RULES.personalBest
        : 0,
  };
  const uncapped = breakdown.correctAnswers + breakdown.completion + breakdown.perfect + breakdown.personalBest;
  const remaining = Math.max(0, XP_RULES.dailySoloXpCap - Math.max(0, facts.soloXpEarnedToday));
  const awarded = Math.min(uncapped, remaining);
  return { ...breakdown, capped: uncapped - awarded, total: awarded };
}

export function calculateMultiplayerXp(input: { rank: number; playerCount: number; correctCount: number }): number {
  if (input.playerCount < 1 || input.rank < 1) return 0;
  const base = XP_RULES.multiplayerGameCompleted + input.correctCount * XP_RULES.correctAnswer;
  const podium = input.playerCount >= 2 ? (XP_RULES.multiplayerPodium[input.rank - 1] ?? 0) : 0;
  return base + podium;
}

/**
 * Current learning streak in days. `activityDays` are calendar dates (YYYY-MM-DD) in the
 * player's local time zone on which they completed a learning activity. A streak survives
 * until the end of the day after the last activity.
 */
export function currentStreak(activityDays: readonly string[], today: string): number {
  const days = new Set(activityDays);
  const start = days.has(today) ? today : shiftDay(today, -1);
  if (!days.has(start)) return 0;
  let streak = 0;
  let cursor = start;
  while (days.has(cursor)) {
    streak += 1;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}

function shiftDay(isoDay: string, delta: number): string {
  const date = new Date(`${isoDay}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new RangeError(`Invalid day: ${isoDay}`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}
