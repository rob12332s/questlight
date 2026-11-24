import { describe, expect, it } from "vitest";
import {
  clockOffset,
  gamePhase,
  newerRound,
  standings,
  upsertPlayer,
  type GamePlayerRow,
  type GameRoomRow,
  type GameRoundRow,
} from "@/features/play/game-state";

const room: GameRoomRow = {
  id: "r",
  room_code: "K7M2QX",
  host_id: "h",
  host_plays: true,
  status: "in_progress",
  current_round: 0,
  question_count: 5,
  seconds_per_question: 20,
};
const t0 = Date.parse("2026-11-24T10:00:00.000Z");
const round: GameRoundRow = {
  round_index: 0,
  question_text: "Q",
  options: [
    { id: "A", text: "a" },
    { id: "B", text: "b" },
  ],
  started_at: new Date(t0).toISOString(),
  deadline_at: new Date(t0 + 20_000).toISOString(),
  closed_at: null,
  correct_option: null,
  explanation: null,
  answers_received: 0,
};

describe("gamePhase", () => {
  it("follows the room status", () => {
    expect(gamePhase({ ...room, status: "lobby" }, null, t0).kind).toBe("lobby");
    expect(gamePhase({ ...room, status: "finished" }, round, t0).kind).toBe("finished");
    expect(gamePhase({ ...room, status: "abandoned" }, null, t0)).toEqual({ kind: "closed", reason: "abandoned" });
  });

  it("waits for the current round's data", () => {
    expect(gamePhase(room, null, t0).kind).toBe("loading");
    expect(gamePhase({ ...room, current_round: 1 }, round, t0).kind).toBe("loading");
  });

  it("counts down, then times the question", () => {
    expect(gamePhase(room, round, t0 - 2500)).toEqual({ kind: "countdown", secondsLeft: 3 });
    expect(gamePhase(room, round, t0 - 10)).toEqual({ kind: "countdown", secondsLeft: 1 });
    expect(gamePhase(room, round, t0 + 5000)).toEqual({ kind: "question", msLeft: 15_000, fraction: 0.75 });
    expect(gamePhase(room, round, t0 + 25_000)).toEqual({ kind: "question", msLeft: 0, fraction: 0 });
  });

  it("reveals once the server closes the round", () => {
    expect(gamePhase(room, { ...round, closed_at: new Date(t0).toISOString() }, t0).kind).toBe("reveal");
  });
});

describe("standings", () => {
  const p = (id: string, score: number, correct = 0, ms = 0, status: GamePlayerRow["connection_status"] = "connected"): GamePlayerRow => ({
    player_id: id,
    display_name: id,
    score,
    correct_count: correct,
    total_correct_ms: ms,
    connection_status: status,
  });

  it("ranks by score and leaves out players who left", () => {
    const ranked = standings([p("a", 100, 1), p("b", 250, 2), p("c", 999, 9, 0, "left")]);
    expect(ranked.map((r) => [r.playerId, r.rank])).toEqual([
      ["b", 1],
      ["a", 2],
    ]);
  });

  it("upserts players by id", () => {
    const list = upsertPlayer([p("a", 0)], p("b", 0));
    expect(list).toHaveLength(2);
    expect(upsertPlayer(list, p("a", 50))[0]!.score).toBe(50);
  });
});

describe("newerRound", () => {
  it("never goes back to an older round", () => {
    const r1 = { ...round, round_index: 1 };
    expect(newerRound(r1, round)).toBe(r1);
    expect(newerRound(round, r1)).toBe(r1);
    expect(newerRound(null, round)).toBe(round);
    expect(newerRound(round, { ...round, answers_received: 3 }).answers_received).toBe(3);
  });
});

describe("clockOffset", () => {
  it("uses the midpoint of the round trip", () => {
    expect(clockOffset(1000, 1200, 6100)).toBe(5000);
  });
});
