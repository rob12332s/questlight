import { describe, expect, it } from "vitest";
import { SCORING_RULES, rankPlayers, scoreRoundAnswer, speedBonus } from "@/domain/scoring";

const timing = { startedAtMs: 1_000_000, deadlineAtMs: 1_020_000 }; // 20 s round

describe("scoreRoundAnswer", () => {
  it("awards base + full bonus for an instant correct answer", () => {
    expect(scoreRoundAnswer(true, timing.startedAtMs, timing)).toEqual({
      accepted: true,
      isCorrect: true,
      basePoints: 100,
      speedBonus: 50,
      total: 150,
    });
  });

  it("awards exactly the base on the deadline", () => {
    const result = scoreRoundAnswer(true, timing.deadlineAtMs, timing);
    expect(result.total).toBe(100);
  });

  it("scales the bonus linearly and rounds down", () => {
    expect(speedBonus(timing.startedAtMs + 10_000, timing)).toBe(25);
    expect(speedBonus(timing.startedAtMs + 1, timing)).toBe(49);
  });

  it("gives zero for incorrect answers regardless of speed", () => {
    const result = scoreRoundAnswer(false, timing.startedAtMs, timing);
    expect(result).toEqual({ accepted: true, isCorrect: false, basePoints: 0, speedBonus: 0, total: 0 });
  });

  it("rejects late and early submissions", () => {
    expect(scoreRoundAnswer(true, timing.deadlineAtMs + 1, timing)).toEqual({
      accepted: false,
      reason: "after_deadline",
      total: 0,
    });
    expect(scoreRoundAnswer(true, timing.startedAtMs - 1, timing)).toMatchObject({ accepted: false, reason: "before_start" });
  });

  it("rejects broken timing", () => {
    expect(scoreRoundAnswer(true, 5, { startedAtMs: 10, deadlineAtMs: 10 })).toMatchObject({ reason: "invalid_timing" });
  });

  it("keeps accuracy more valuable than speed", () => {
    const slowestCorrect = SCORING_RULES.basePoints;
    const fastestCorrect = SCORING_RULES.basePoints + SCORING_RULES.maxSpeedBonus;
    expect(2 * slowestCorrect).toBeGreaterThan(fastestCorrect);
    expect(SCORING_RULES.maxSpeedBonus).toBeLessThan(SCORING_RULES.basePoints);
  });
});

describe("rankPlayers", () => {
  const player = (id: string, score: number, correctCount: number, ms: number) => ({
    playerId: id,
    displayName: id,
    score,
    correctCount,
    totalCorrectAnswerMs: ms,
  });

  it("orders by score, then correct answers, then time", () => {
    const ranked = rankPlayers([player("c", 200, 2, 9000), player("a", 300, 2, 9000), player("b", 200, 2, 4000)]);
    expect(ranked.map((p) => [p.playerId, p.rank])).toEqual([
      ["a", 1],
      ["b", 2],
      ["c", 3],
    ]);
  });

  it("shares a rank only on a complete tie (1, 2, 2, 4)", () => {
    const ranked = rankPlayers([
      player("w", 400, 3, 1000),
      player("x", 300, 2, 5000),
      player("y", 300, 2, 5000),
      player("z", 100, 1, 2000),
    ]);
    expect(ranked.map((p) => p.rank)).toEqual([1, 2, 2, 4]);
  });

  it("does not mutate its input", () => {
    const input = [player("b", 1, 0, 0), player("a", 2, 0, 0)];
    rankPlayers(input);
    expect(input[0]?.playerId).toBe("b");
  });
});
