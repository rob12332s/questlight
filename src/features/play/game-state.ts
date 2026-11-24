/**
 * Client-side view of a live game. The server owns every decision (timing, scoring,
 * who may move on); these helpers only decide what to show from the rows we can read.
 */
import type { AnswerOption } from "@/domain/types";
import { rankPlayers } from "@/domain/scoring";

export type RoomStatus = "lobby" | "in_progress" | "finished" | "abandoned" | "expired";

export interface GameRoomRow {
  id: string;
  room_code: string;
  host_id: string;
  /** False for class games: the teacher hosts on the board and doesn't answer. */
  host_plays: boolean;
  status: RoomStatus;
  current_round: number;
  question_count: number;
  seconds_per_question: number;
}

export interface GamePlayerRow {
  player_id: string;
  display_name: string;
  score: number;
  correct_count: number;
  total_correct_ms: number;
  connection_status: "connected" | "disconnected" | "left";
}

export interface GameRoundRow {
  round_index: number;
  question_text: string;
  options: AnswerOption[];
  started_at: string;
  deadline_at: string;
  closed_at: string | null;
  correct_option: string | null;
  explanation: string | null;
  answers_received: number;
}

export interface MyAnswer {
  option: string;
  /** Known once the round closes (read from our own game_answers row). */
  isCorrect?: boolean;
  points?: number;
}

export type GamePhase =
  | { kind: "lobby" }
  | { kind: "loading" }
  | { kind: "countdown"; secondsLeft: number }
  | { kind: "question"; msLeft: number; fraction: number }
  | { kind: "reveal" }
  | { kind: "finished" }
  | { kind: "closed"; reason: "abandoned" | "expired" };

export function gamePhase(room: GameRoomRow, round: GameRoundRow | null, nowMs: number): GamePhase {
  if (room.status === "lobby") return { kind: "lobby" };
  if (room.status === "abandoned" || room.status === "expired") return { kind: "closed", reason: room.status };
  if (room.status === "finished") return { kind: "finished" };
  if (!round || round.round_index !== room.current_round) return { kind: "loading" };
  if (round.closed_at) return { kind: "reveal" };
  const start = Date.parse(round.started_at);
  const deadline = Date.parse(round.deadline_at);
  if (nowMs < start) return { kind: "countdown", secondsLeft: Math.ceil((start - nowMs) / 1000) };
  const msLeft = Math.max(0, deadline - nowMs);
  const window = Math.max(1, deadline - start);
  return { kind: "question", msLeft, fraction: Math.min(1, msLeft / window) };
}

/** Players still in the game, best first, with shared ranks for exact ties. */
export function standings(players: readonly GamePlayerRow[]) {
  return rankPlayers(
    players
      .filter((p) => p.connection_status !== "left")
      .map((p) => ({
        playerId: p.player_id,
        displayName: p.display_name,
        score: p.score,
        correctCount: p.correct_count,
        totalCorrectAnswerMs: p.total_correct_ms,
      })),
  );
}

/** Inserts or replaces one player row (from a Realtime change). */
export function upsertPlayer(players: readonly GamePlayerRow[], next: GamePlayerRow): GamePlayerRow[] {
  const i = players.findIndex((p) => p.player_id === next.player_id);
  if (i === -1) return [...players, next];
  const copy = players.slice();
  copy[i] = next;
  return copy;
}

/** Keeps the newest round we know about; ignores stale updates for older rounds. */
export function newerRound(current: GameRoundRow | null, incoming: GameRoundRow): GameRoundRow {
  if (!current || incoming.round_index > current.round_index) return incoming;
  if (incoming.round_index < current.round_index) return current;
  return { ...current, ...incoming };
}

/** Server clock offset from one round trip: serverTime − midpoint of the request. */
export function clockOffset(sentAtMs: number, receivedAtMs: number, serverTimeMs: number): number {
  return serverTimeMs - (sentAtMs + receivedAtMs) / 2;
}
