import { describe, expect, it } from "vitest";
import {
  MAX_LEVEL,
  XP_RULES,
  calculateMultiplayerXp,
  calculateSoloQuizXp,
  currentStreak,
  levelFromXp,
  totalXpForLevel,
  xpForNextLevel,
} from "@/domain/progression";

describe("level curve", () => {
  it("starts at level 1 with 0 XP", () => {
    expect(levelFromXp(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForNextLevel: 100, progress: 0, isMaxLevel: false });
  });

  it("is consistent: total(L+1) = total(L) + step(L)", () => {
    for (let level = 1; level < MAX_LEVEL; level++) {
      expect(totalXpForLevel(level + 1)).toBe(totalXpForLevel(level) + xpForNextLevel(level));
    }
  });

  it("levels up exactly at the threshold", () => {
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(totalXpForLevel(10)).level).toBe(10);
    expect(levelFromXp(totalXpForLevel(10) - 1).level).toBe(9);
  });

  it("reports progress within a level", () => {
    const p = levelFromXp(100 + 75); // level 2 needs 150 to reach 3
    expect(p).toMatchObject({ level: 2, xpIntoLevel: 75, xpForNextLevel: 150, progress: 0.5 });
  });

  it("caps at the max level", () => {
    const p = levelFromXp(totalXpForLevel(MAX_LEVEL) + 1_000_000);
    expect(p).toMatchObject({ level: MAX_LEVEL, progress: 1, isMaxLevel: true });
  });

  it("treats negative or invalid XP as zero", () => {
    expect(levelFromXp(-50).level).toBe(1);
    expect(levelFromXp(Number.NaN).level).toBe(1);
  });

  it("rejects invalid levels", () => {
    expect(() => xpForNextLevel(0)).toThrow(RangeError);
    expect(() => totalXpForLevel(1.5)).toThrow(RangeError);
  });
});

describe("calculateSoloQuizXp", () => {
  const answers = (n: number, correct: number, alreadyRewarded = false) =>
    Array.from({ length: n }, (_, i) => ({ questionId: `q${i}`, isCorrect: i < correct, alreadyRewardedToday: alreadyRewarded }));

  it("rewards correct answers plus completion", () => {
    const xp = calculateSoloQuizXp({ answers: answers(5, 3), soloXpEarnedToday: 0, previousBestAccuracy: null });
    expect(xp).toEqual({ correctAnswers: 30, completion: 20, perfect: 0, personalBest: 0, capped: 0, total: 50 });
  });

  it("adds perfect and personal-best bonuses", () => {
    const xp = calculateSoloQuizXp({ answers: answers(5, 5), soloXpEarnedToday: 0, previousBestAccuracy: 0.6 });
    expect(xp.total).toBe(50 + XP_RULES.quizCompleted + XP_RULES.perfectQuiz + XP_RULES.personalBest);
  });

  it("pays nothing for replaying an already-rewarded set (anti-farming)", () => {
    const xp = calculateSoloQuizXp({ answers: answers(5, 5, true), soloXpEarnedToday: 0, previousBestAccuracy: 1 });
    expect(xp.total).toBe(0);
  });

  it("counts duplicate question ids once", () => {
    const dup = [...answers(5, 5), { questionId: "q0", isCorrect: true, alreadyRewardedToday: false }];
    expect(calculateSoloQuizXp({ answers: dup, soloXpEarnedToday: 0, previousBestAccuracy: null }).correctAnswers).toBe(50);
  });

  it("gives no completion bonus for tiny quizzes", () => {
    const xp = calculateSoloQuizXp({ answers: answers(4, 4), soloXpEarnedToday: 0, previousBestAccuracy: null });
    expect(xp).toMatchObject({ completion: 0, perfect: 0, total: 40 });
  });

  it("respects the daily cap", () => {
    const xp = calculateSoloQuizXp({
      answers: answers(5, 5),
      soloXpEarnedToday: XP_RULES.dailySoloXpCap - 10,
      previousBestAccuracy: null,
    });
    expect(xp.total).toBe(10);
    expect(xp.capped).toBe(85);
  });
});

describe("calculateMultiplayerXp", () => {
  it("rewards participation, correct answers and podium", () => {
    expect(calculateMultiplayerXp({ rank: 1, playerCount: 4, correctCount: 5 })).toBe(20 + 50 + 30);
    expect(calculateMultiplayerXp({ rank: 4, playerCount: 4, correctCount: 0 })).toBe(20);
  });

  it("gives no podium bonus when playing alone", () => {
    expect(calculateMultiplayerXp({ rank: 1, playerCount: 1, correctCount: 2 })).toBe(40);
  });
});

describe("currentStreak", () => {
  it("counts consecutive days ending today", () => {
    expect(currentStreak(["2026-11-21", "2026-11-22", "2026-11-23"], "2026-11-23")).toBe(3);
  });

  it("keeps a streak alive until the end of the next day", () => {
    expect(currentStreak(["2026-11-21", "2026-11-22"], "2026-11-23")).toBe(2);
  });

  it("resets after a missed day", () => {
    expect(currentStreak(["2026-11-20", "2026-11-21"], "2026-11-23")).toBe(0);
  });

  it("works across month boundaries", () => {
    expect(currentStreak(["2026-10-31", "2026-11-01"], "2026-11-01")).toBe(2);
  });
});
