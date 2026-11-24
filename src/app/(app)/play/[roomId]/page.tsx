import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { GameRoom } from "@/features/play/game-room";
import type { GamePlayerRow, GameRoomRow, GameRoundRow, MyAnswer } from "@/features/play/game-state";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/server/session";

export const metadata: Metadata = { title: "Live game" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function GamePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  if (!UUID.test(roomId)) notFound();
  const student = await getCurrentStudent();
  if (!student) redirect(`/login?next=/play/${roomId}`);
  const supabase = await getServerSupabase();

  // RLS: members only. Someone who isn't in the room (or has left) gets "not found".
  const { data: roomData } = await supabase
    .from("game_rooms")
    .select("id, room_code, host_id, host_plays, status, current_round, question_count, seconds_per_question, subjects(name), topics(name)")
    .eq("id", roomId)
    .maybeSingle();
  if (!roomData) notFound();
  const { subjects, topics, ...room } = roomData as unknown as GameRoomRow & {
    subjects: { name: string } | null;
    topics: { name: string } | null;
  };

  const [{ data: players }, { data: rounds }, { data: answers }] = await Promise.all([
    supabase
      .from("room_players")
      .select("player_id, display_name, score, correct_count, total_correct_ms, connection_status")
      .eq("room_id", roomId),
    supabase
      .from("room_rounds")
      .select("round_index, question_text, options, started_at, deadline_at, closed_at, correct_option, explanation, answers_received")
      .eq("room_id", roomId)
      .order("round_index", { ascending: false })
      .limit(1),
    supabase.from("game_answers").select("round_index, submitted_option, is_correct, points_awarded").eq("room_id", roomId),
  ]);

  const myAnswers: Record<number, MyAnswer> = {};
  for (const a of (answers ?? []) as Array<{
    round_index: number;
    submitted_option: string;
    is_correct: boolean;
    points_awarded: number;
  }>) {
    myAnswers[a.round_index] = { option: a.submitted_option, isCorrect: a.is_correct, points: a.points_awarded };
  }

  return (
    <GameRoom
      userId={student.userId}
      title={topics?.name ?? subjects?.name ?? "Live game"}
      subtitle={topics ? (subjects?.name ?? "") : "Whole subject"}
      initial={{
        room,
        players: (players ?? []) as GamePlayerRow[],
        round: ((rounds ?? [])[0] as GameRoundRow | undefined) ?? null,
        answers: myAnswers,
      }}
    />
  );
}
