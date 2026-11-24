"use client";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Copy, Crown, Loader2, LogOut, Users, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnswerOption, type OptionState } from "@/components/learning/answer-option";
import { Button, ButtonLink } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form";
import { seededShuffle } from "@/domain/shuffle";
import { OPTION_IDS } from "@/domain/types";
import { cn } from "@/lib/cn";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { useNow } from "@/lib/use-now";
import {
  clockOffset,
  gamePhase,
  newerRound,
  standings,
  upsertPlayer,
  type GamePhase,
  type GamePlayerRow,
  type GameRoomRow,
  type GameRoundRow,
  type MyAnswer,
} from "./game-state";
import { gameErrorMessage } from "./messages";

const EASE = [0.22, 1, 0.36, 1] as const;
type Change = RealtimePostgresChangesPayload<Record<string, unknown>>;
const ROOM_COLUMNS = "id, room_code, host_id, status, current_round, question_count, seconds_per_question";
const PLAYER_COLUMNS = "player_id, display_name, score, correct_count, total_correct_ms, connection_status";
const ROUND_COLUMNS =
  "round_index, question_text, options, started_at, deadline_at, closed_at, correct_option, explanation, answers_received";
/** After a reveal, non-hosts may move on once the host has been quiet this long (matches next_round). */
const HOST_GRACE_MS = 15_000;

interface Initial {
  room: GameRoomRow;
  players: GamePlayerRow[];
  round: GameRoundRow | null;
  answers: Record<number, MyAnswer>;
}

function pickRoom(row: Record<string, unknown>): Partial<GameRoomRow> {
  const out: Partial<GameRoomRow> = {};
  for (const key of ["id", "room_code", "host_id", "status", "current_round", "question_count", "seconds_per_question"] as const) {
    if (key in row) (out as Record<string, unknown>)[key] = row[key];
  }
  return out;
}

/** Live state for one room: Realtime first, with polling as a safety net. */
function useLiveGame(initial: Initial) {
  const supabase = getBrowserSupabase();
  const roomId = initial.room.id;
  const [room, setRoom] = useState<GameRoomRow | null>(initial.room);
  const [players, setPlayers] = useState(initial.players);
  const [round, setRound] = useState<GameRoundRow | null>(initial.round);
  const [answers, setAnswers] = useState(initial.answers);
  const [offset, setOffset] = useState(0);
  const [live, setLive] = useState(false);
  const now = useNow();

  const fetchAnswers = useCallback(async () => {
    const { data } = await supabase
      .from("game_answers")
      .select("round_index, submitted_option, is_correct, points_awarded")
      .eq("room_id", roomId);
    if (!data) return;
    setAnswers((prev) => {
      const next = { ...prev };
      for (const a of data as Array<{ round_index: number; submitted_option: string; is_correct: boolean; points_awarded: number }>) {
        next[a.round_index] = { option: a.submitted_option, isCorrect: a.is_correct, points: a.points_awarded };
      }
      return next;
    });
  }, [roomId, supabase]);

  const refresh = useCallback(async () => {
    const [roomRes, playersRes, roundRes] = await Promise.all([
      supabase.from("game_rooms").select(ROOM_COLUMNS).eq("id", roomId).maybeSingle(),
      supabase.from("room_players").select(PLAYER_COLUMNS).eq("room_id", roomId),
      supabase.from("room_rounds").select(ROUND_COLUMNS).eq("room_id", roomId).order("round_index", { ascending: false }).limit(1),
    ]);
    if (roomRes.error || playersRes.error || roundRes.error) return; // Network blip: keep what we have.
    setRoom((roomRes.data as GameRoomRow | null) ?? null);
    setPlayers((playersRes.data ?? []) as GamePlayerRow[]);
    const latest = ((roundRes.data ?? [])[0] as GameRoundRow | undefined) ?? null;
    if (latest) setRound((prev) => newerRound(prev, latest));
    await fetchAnswers();
  }, [fetchAnswers, roomId, supabase]);

  // Line our clock up with the server's, so countdowns match the deadlines it enforces.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sent = Date.now();
      const { data } = await supabase.rpc("server_time");
      const received = Date.now();
      if (!cancelled && typeof data === "string") setOffset(clockOffset(sent, received, Date.parse(data)));
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Realtime: apply row changes directly, so a class full of answers doesn't trigger a flood of queries.
  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) await supabase.realtime.setAuth(data.session.access_token);
      if (cancelled) return;
      channel = supabase
        .channel(`room:${roomId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "game_rooms", filter: `id=eq.${roomId}` }, (payload: Change) => {
          const row = payload.new as Record<string, unknown>;
          if (row && "id" in row) setRoom((prev) => (prev ? { ...prev, ...pickRoom(row) } : prev));
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` }, (payload: Change) => {
          const row = payload.new as unknown as GamePlayerRow | undefined;
          if (row && "player_id" in row) setPlayers((prev) => upsertPlayer(prev, row));
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "room_rounds", filter: `room_id=eq.${roomId}` }, (payload: Change) => {
          const row = payload.new as unknown as GameRoundRow | undefined;
          if (!row || !("round_index" in row)) return;
          setRound((prev) => newerRound(prev, row));
          if (row.closed_at) void fetchAnswers();
        })
        .subscribe((status: string) => {
          const ok = status === "SUBSCRIBED";
          setLive(ok);
          if (ok) void refresh(); // Catch anything that changed before we were listening.
        });
    })();
    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [fetchAnswers, refresh, roomId, supabase]);

  // Safety net: poll often if Realtime isn't connected, rarely if it is.
  useEffect(() => {
    const id = window.setInterval(() => void refresh(), live ? 15_000 : 2_500);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [live, refresh]);

  // 0 until the browser clock is known (first render and hydration).
  return { supabase, room, players, round, answers, setAnswers, refresh, fetchAnswers, serverNow: now === 0 ? 0 : now + offset };
}

export function GameRoom({
  userId,
  title,
  subtitle,
  initial,
}: {
  userId: string;
  title: string;
  subtitle: string;
  initial: Initial;
}) {
  const router = useRouter();
  const { supabase, room, players, round, answers, setAnswers, refresh, serverNow } = useLiveGame(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
  const closingRound = useRef<number | null>(null);

  const roomId = initial.room.id;
  const rawPhase: GamePhase = room ? gamePhase(room, round, serverNow) : { kind: "closed", reason: "abandoned" };
  // Timed screens wait until the clock is known, so they never flash a wrong countdown.
  const phase: GamePhase =
    serverNow === 0 && (rawPhase.kind === "countdown" || rawPhase.kind === "question") ? { kind: "loading" } : rawPhase;
  const isHost = room?.host_id === userId;
  const activePlayers = players.filter((p) => p.connection_status !== "left");
  const timeUp = phase.kind === "question" && phase.msLeft === 0;

  // When time runs out, ask the server to close the round. Every client may ask; the
  // server only closes once, and only when the deadline has really passed.
  useEffect(() => {
    if (!timeUp || !round || closingRound.current === round.round_index) return;
    const r = round.round_index;
    closingRound.current = r;
    let tries = 0;
    let timer: number;
    const attempt = async () => {
      const { data } = await supabase.rpc("close_round", { p_room: roomId, p_round: r });
      if ((data as { closed?: boolean } | null)?.closed) {
        void refresh();
        return;
      }
      tries += 1;
      if (tries < 6) timer = window.setTimeout(attempt, 1000);
    };
    // A small random delay spreads a class's requests out.
    timer = window.setTimeout(attempt, 250 + Math.random() * 500);
    return () => window.clearTimeout(timer);
  }, [refresh, roomId, round, supabase, timeUp]);

  const run = useCallback(
    async (fn: () => PromiseLike<{ error: { hint?: string | null } | null }>) => {
      setBusy(true);
      setError(null);
      const { error: err } = await fn();
      setBusy(false);
      if (err) setError(gameErrorMessage(err.hint));
      void refresh();
      return !err;
    },
    [refresh],
  );

  const startGame = () => run(() => supabase.rpc("start_game", { p_room: roomId }));
  const nextRound = () =>
    room && run(() => supabase.rpc("next_round", { p_room: roomId, p_from_round: room.current_round }));
  const leave = async () => {
    setBusy(true);
    const { error: err } = await supabase.rpc("leave_room", { p_room: roomId });
    if (err) {
      setBusy(false);
      setError(gameErrorMessage(err.hint));
      return;
    }
    router.push("/play");
  };

  const answer = useCallback(
    async (option: string) => {
      if (!round || answers[round.round_index] || phase.kind !== "question" || timeUp) return;
      const r = round.round_index;
      setError(null);
      setAnswers((prev) => ({ ...prev, [r]: { option } }));
      const { error: err } = await supabase.rpc("submit_game_answer", { p_room: roomId, p_round: r, p_option: option });
      if (err && err.hint !== "already_answered") {
        setAnswers((prev) => {
          const next = { ...prev };
          delete next[r];
          return next;
        });
        setError(gameErrorMessage(err.hint));
      }
    },
    [answers, phase.kind, roomId, round, setAnswers, supabase, timeUp],
  );

  if (!room || phase.kind === "closed") {
    return (
      <CenteredMessage
        title={phase.kind === "closed" && phase.reason === "expired" ? "This game has expired." : "This game has closed."}
        body={room ? "The host left before it started. You can start or join another one." : "You're no longer in this game."}
      />
    );
  }

  const header = (
    <header className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="truncate text-sm text-ink-muted">{subtitle}</p>
        <h1 className="truncate text-xl font-semibold">{title}</h1>
      </div>
      {room.status === "in_progress" && room.current_round >= 0 && (
        <p className="tabular shrink-0 text-sm text-ink-soft" aria-live="polite">
          Question {room.current_round + 1} of {room.question_count}
        </p>
      )}
    </header>
  );

  const isLastRoundReveal = Boolean(
    phase.kind === "finished" && !showFinal && round?.closed_at && round.round_index === room.question_count - 1,
  );

  return (
    <div className="mx-auto max-w-2xl">
      {header}
      {error && (
        <div className="mt-4">
          <FormAlert tone="error">{error}</FormAlert>
        </div>
      )}
      <div className="mt-6">
        <AnimatePresence mode="wait" initial={false}>
          {phase.kind === "lobby" && (
            <Stage key="lobby">
              <Lobby
                room={room}
                players={activePlayers}
                userId={userId}
                isHost={isHost}
                busy={busy}
                onStart={startGame}
                onLeave={leave}
              />
            </Stage>
          )}
          {phase.kind === "loading" && (
            <Stage key="loading">
              <p className="flex items-center gap-2 text-ink-soft">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Getting the next question…
              </p>
            </Stage>
          )}
          {phase.kind === "countdown" && round && (
            <Stage key={`countdown-${round.round_index}`}>
              <Countdown seconds={phase.secondsLeft} />
            </Stage>
          )}
          {(phase.kind === "question" || phase.kind === "reveal" || isLastRoundReveal) && round && (
            <Stage key={`round-${round.round_index}`}>
              <RoundView
                roomId={roomId}
                round={round}
                phase={phase}
                mine={answers[round.round_index]}
                playerCount={activePlayers.length}
                onAnswer={answer}
              />
              {round.closed_at && (
                <RevealFooter
                  round={round}
                  mine={answers[round.round_index]}
                  players={players}
                  userId={userId}
                  isHost={isHost}
                  isLast={round.round_index >= room.question_count - 1}
                  busy={busy}
                  serverNow={serverNow}
                  onNext={() => void nextRound()}
                  onFinal={() => setShowFinal(true)}
                />
              )}
            </Stage>
          )}
          {phase.kind === "finished" && !isLastRoundReveal && (
            <Stage key="final">
              <FinalResults roomId={roomId} players={players} userId={userId} />
            </Stage>
          )}
        </AnimatePresence>
      </div>
      {room.status === "in_progress" && (
        <div className="mt-10 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => void leave()}
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden /> Leave game
          </button>
        </div>
      )}
    </div>
  );
}

function Stage({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function CenteredMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="py-10">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-3 max-w-md text-ink-soft">{body}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/play">Go to live games</ButtonLink>
        <ButtonLink href="/dashboard" variant="secondary">
          Back to your dashboard
        </ButtonLink>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Lobby({
  room,
  players,
  userId,
  isHost,
  busy,
  onStart,
  onLeave,
}: {
  room: GameRoomRow;
  players: GamePlayerRow[];
  userId: string;
  isHost: boolean;
  busy: boolean;
  onStart: () => void;
  onLeave: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const host = players.find((p) => p.player_id === room.host_id);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/play?code=${room.room_code}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <section aria-labelledby="code-label" className="rounded-xl border border-line bg-deep p-6 text-center sm:p-8">
        <p id="code-label" className="text-sm text-ink-soft">
          Join at Questlight with this code
        </p>
        <p className="tabular mt-3 text-5xl font-semibold tracking-[0.18em] text-ink sm:text-6xl">
          <span aria-hidden data-testid="room-code">
            {room.room_code}
          </span>
          <span className="sr-only">Game code: {room.room_code.split("").join(" ")}</span>
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => void copy()}>
            {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {copied ? "Link copied" : "Copy invite link"}
          </Button>
        </div>
        <p className="mt-4 text-sm text-ink-muted">
          {room.question_count} questions, {room.seconds_per_question} seconds each
        </p>
      </section>

      <section aria-labelledby="players-heading" className="mt-8">
        <h2 id="players-heading" className="flex items-center gap-2 text-lg font-semibold">
          <Users className="h-4 w-4 text-ink-soft" aria-hidden />
          Players <span className="tabular text-ink-soft">({players.length})</span>
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2" aria-live="polite">
          <AnimatePresence initial={false}>
            {players.map((p) => (
              <motion.li
                key={p.player_id}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.3, ease: EASE }}
                className={cn(
                  "flex items-center gap-2 rounded-full border py-1.5 pr-4 pl-1.5",
                  p.player_id === userId ? "border-beam/50 bg-beam-wash" : "border-line bg-deep",
                )}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-raised text-xs font-semibold text-ink-soft" aria-hidden>
                  {initials(p.display_name)}
                </span>
                <span className="text-sm font-medium">{p.display_name}</span>
                {p.player_id === room.host_id && (
                  <span className="text-xs text-ink-muted">
                    <span className="sr-only">, </span>host
                  </span>
                )}
                {p.player_id === userId && <span className="sr-only">(you)</span>}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        {isHost ? (
          <>
            <Button size="lg" onClick={onStart} disabled={busy || players.length < 2}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Start game
            </Button>
            {players.length < 2 && <p className="text-sm text-ink-muted">Waiting for at least one more player to join.</p>}
          </>
        ) : (
          <p className="flex items-center gap-2 text-ink-soft">
            <span className="relative flex h-2.5 w-2.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-beam opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-beam" />
            </span>
            Waiting for {host?.display_name ?? "the host"} to start the game
          </p>
        )}
        <button
          type="button"
          onClick={onLeave}
          className="ml-auto text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
        >
          {isHost ? "Close room" : "Leave"}
        </button>
      </div>
    </div>
  );
}

function Countdown({ seconds }: { seconds: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-line bg-deep">
      <p className="text-sm text-ink-soft">Get ready</p>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.p
          key={seconds}
          initial={reduceMotion ? false : { opacity: 0, scale: 1.4 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="tabular mt-2 text-7xl font-semibold text-beam-bright"
          aria-live="assertive"
        >
          {Math.max(1, seconds)}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function optionStateFor(id: string, round: GameRoundRow, mine: MyAnswer | undefined): OptionState {
  if (!round.closed_at) return mine?.option === id ? "selected" : mine ? "dimmed" : "idle";
  if (mine?.option === id) return id === round.correct_option ? "correct" : "incorrect";
  if (id === round.correct_option) return "missed";
  return "dimmed";
}

function RoundView({
  roomId,
  round,
  phase,
  mine,
  playerCount,
  onAnswer,
}: {
  roomId: string;
  round: GameRoundRow;
  phase: GamePhase;
  mine: MyAnswer | undefined;
  playerCount: number;
  onAnswer: (option: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const open = phase.kind === "question" && phase.msLeft > 0;
  // Same order for everyone in the room; true/false keeps its natural order.
  const shown = useMemo(
    () => (round.options.length === 4 ? seededShuffle(round.options, `${roomId}/${round.round_index}`) : round.options),
    [roomId, round.options, round.round_index],
  );
  const seconds = phase.kind === "question" ? Math.ceil(phase.msLeft / 1000) : 0;
  const initialFraction = phase.kind === "question" ? phase.fraction : 0;
  const initialMs = phase.kind === "question" ? phase.msLeft : 0;

  // Keys 1–4 answer, following the shown order.
  useEffect(() => {
    if (!open || mine) return;
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const position = Number(event.key);
      const option = Number.isInteger(position) && position >= 1 ? shown[position - 1] : undefined;
      if (option) {
        event.preventDefault();
        onAnswer(option.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mine, onAnswer, open, shown]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="tabular text-ink-soft" aria-live="polite">
          {round.closed_at ? "Answers are in" : `${Math.min(round.answers_received, playerCount)} of ${playerCount} answered`}
        </span>
        {!round.closed_at && (
          <span className={cn("tabular font-medium", seconds <= 5 ? "text-caution" : "text-ink")} aria-hidden>
            {seconds}s
          </span>
        )}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate" aria-hidden>
        {!round.closed_at && (
          <motion.div
            key={round.round_index}
            className={cn("h-full origin-left rounded-full", seconds <= 5 ? "bg-caution" : "bg-beam")}
            initial={{ scaleX: initialFraction }}
            animate={{ scaleX: 0 }}
            transition={{ duration: reduceMotion ? 0 : initialMs / 1000, ease: "linear" }}
          />
        )}
      </div>

      <section
        aria-labelledby={`gq-${round.round_index}`}
        className="relative mt-5 overflow-hidden rounded-xl bg-paper p-5 text-paper-ink shadow-paper sm:p-7"
      >
        <h2 id={`gq-${round.round_index}`} className="text-xl leading-snug font-semibold tracking-[-0.015em] sm:text-[1.375rem]">
          {round.question_text}
        </h2>
        <div className={cn("mt-5 grid gap-2", shown.length === 2 && "sm:grid-cols-2")} role="group" aria-label="Answer options">
          {shown.map((option, position) => (
            <AnswerOption
              key={option.id}
              option={option}
              label={OPTION_IDS[position]!}
              state={optionStateFor(option.id, round, mine)}
              disabled={!open || Boolean(mine)}
              onSelect={(id) => onAnswer(id)}
            />
          ))}
        </div>
        {!round.closed_at && (
          <p className="mt-4 text-sm text-paper-ink-soft" aria-live="polite">
            {mine ? "Locked in. Waiting for everyone else…" : open ? "Tip: press 1–" + shown.length + " to answer" : "Time's up"}
          </p>
        )}
      </section>
    </div>
  );
}

function RevealFooter({
  round,
  mine,
  players,
  userId,
  isHost,
  isLast,
  busy,
  serverNow,
  onNext,
  onFinal,
}: {
  round: GameRoundRow;
  mine: MyAnswer | undefined;
  players: GamePlayerRow[];
  userId: string;
  isHost: boolean;
  isLast: boolean;
  busy: boolean;
  serverNow: number;
  onNext: () => void;
  onFinal: () => void;
}) {
  const ranked = standings(players);
  const myIndex = ranked.findIndex((r) => r.playerId === userId);
  const top = ranked.slice(0, 5);
  const showMe = myIndex >= 5 ? ranked[myIndex] : undefined;
  const hostQuiet = round.closed_at ? serverNow - Date.parse(round.closed_at) > HOST_GRACE_MS : false;
  const correct = mine?.isCorrect ?? (mine ? mine.option === round.correct_option : undefined);

  return (
    <div className="mt-5 space-y-6">
      <div className="rounded-xl border border-line bg-deep p-5" role="status">
        <p className="flex items-center gap-2 text-lg font-semibold">
          {correct ? (
            <>
              <Check className="h-5 w-5 text-correct" aria-hidden strokeWidth={2.5} /> Correct
              {typeof mine?.points === "number" && <span className="tabular text-beam-bright">+{mine.points}</span>}
            </>
          ) : mine ? (
            <>
              <X className="h-5 w-5 text-incorrect" aria-hidden strokeWidth={2.5} /> Not quite
            </>
          ) : (
            <>No answer this time</>
          )}
        </p>
        {round.explanation && <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{round.explanation}</p>}
      </div>

      <section aria-labelledby={`standings-${round.round_index}`}>
        <h3 id={`standings-${round.round_index}`} className="text-sm font-medium text-ink-soft">
          Standings
        </h3>
        <ol className="mt-2 divide-y divide-line rounded-xl border border-line">
          {[...top, ...(showMe ? [showMe] : [])].map((p) => (
            <motion.li
              layout
              key={p.playerId}
              className={cn("flex items-center gap-3 px-4 py-2.5", p.playerId === userId && "bg-beam-wash")}
            >
              <span className="tabular w-6 text-sm text-ink-muted">{p.rank}</span>
              <span className="flex-1 truncate font-medium">
                {p.displayName}
                {p.playerId === userId && <span className="text-ink-muted"> (you)</span>}
              </span>
              <span className="tabular text-sm">{p.score}</span>
            </motion.li>
          ))}
        </ol>
      </section>

      <div className="flex min-h-12 items-center gap-4">
        {isLast ? (
          <Button size="lg" onClick={onFinal}>
            See final results
          </Button>
        ) : isHost || hostQuiet ? (
          <Button size="lg" onClick={onNext} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {isHost ? "Next question" : "Continue"}
          </Button>
        ) : (
          <p className="text-ink-soft">Waiting for the host to move on…</p>
        )}
      </div>
    </div>
  );
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

function FinalResults({ roomId, players, userId }: { roomId: string; players: GamePlayerRow[]; userId: string }) {
  const reduceMotion = useReducedMotion();
  const ranked = standings(players);
  const me = ranked.find((r) => r.playerId === userId);
  const podium = ranked.slice(0, 3);
  const [xp, setXp] = useState<number | null>(null);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("xp_events")
        .select("amount")
        .eq("source", "multiplayer_game")
        .eq("source_id", roomId)
        .maybeSingle();
      if (!cancelled) setXp((data as { amount: number } | null)?.amount ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  // Podium order on screen: 2nd, 1st, 3rd.
  const order = [podium[1], podium[0], podium[2]].filter(Boolean) as typeof podium;
  const heights: Record<number, string> = { 1: "h-36", 2: "h-28", 3: "h-20" };

  return (
    <div>
      <h2 className="text-3xl font-semibold">Final results</h2>
      {me && (
        <p className="mt-2 text-ink-soft">
          You finished <span className="font-semibold text-ink">{ordinal(me.rank)}</span> of {ranked.length}
          {xp !== null && xp > 0 && (
            <>
              {" "}
              and earned <span className="tabular font-semibold text-beam-bright">+{xp} XP</span>
            </>
          )}
          .
        </p>
      )}

      <div className="mt-10 flex items-end justify-center gap-3 sm:gap-5" aria-hidden>
        {order.map((p, i) => (
          <div key={p.playerId} className="flex w-24 flex-col items-center sm:w-32">
            {p.rank === 1 && <Crown className="mb-1 h-5 w-5 text-caution" />}
            <span className="w-full truncate text-center text-sm font-medium">{p.displayName}</span>
            <span className="tabular text-xs text-ink-muted">{p.score}</span>
            <motion.div
              initial={reduceMotion ? false : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.7, ease: EASE, delay: reduceMotion ? 0 : 0.15 + i * 0.12 }}
              className={cn(
                "mt-2 flex w-full origin-bottom items-start justify-center rounded-t-lg pt-3 text-2xl font-semibold",
                heights[p.rank] ?? "h-16",
                p.rank === 1 ? "bg-beam text-night" : "bg-slate-raised text-ink-soft",
              )}
            >
              {p.rank}
            </motion.div>
          </div>
        ))}
      </div>

      <ol className="mt-8 divide-y divide-line rounded-xl border border-line" aria-label="Final standings">
        {ranked.map((p) => (
          <li key={p.playerId} className={cn("flex items-center gap-3 px-4 py-2.5", p.playerId === userId && "bg-beam-wash")}>
            <span className="tabular w-6 text-sm text-ink-muted">{p.rank}</span>
            <span className="flex-1 truncate font-medium">
              {p.displayName}
              {p.playerId === userId && <span className="text-ink-muted"> (you)</span>}
            </span>
            <span className="tabular text-sm text-ink-soft">{p.correctCount} right</span>
            <span className="tabular w-14 text-right text-sm font-medium">{p.score}</span>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/play">Play another game</ButtonLink>
        <ButtonLink href="/dashboard" variant="secondary">
          Back to dashboard
        </ButtonLink>
      </div>
      <p className="mt-6 text-sm text-ink-muted">
        Games are scored on the server: 100 points for a right answer, plus up to 50 for speed.{" "}
        <Link href="/achievements" className="underline underline-offset-4">
          See your achievements
        </Link>
        .
      </p>
    </div>
  );
}
