import "server-only";

import { getServerSupabase } from "@/lib/supabase/server";

export interface OpenRoom {
  id: string;
  roomCode: string;
  status: "lobby" | "in_progress";
  hostId: string;
  name: string;
}

/** Live games the student is still in (RLS limits rooms to members who haven't left). */
export async function getOpenRooms(): Promise<OpenRoom[]> {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("game_rooms")
    .select("id, room_code, status, host_id, subjects(name), topics(name)")
    .in("status", ["lobby", "in_progress"])
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(5);
  return ((data ?? []) as unknown as Array<{
    id: string;
    room_code: string;
    status: "lobby" | "in_progress";
    host_id: string;
    subjects: { name: string } | null;
    topics: { name: string } | null;
  }>).map((r) => ({
    id: r.id,
    roomCode: r.room_code,
    status: r.status,
    hostId: r.host_id,
    name: r.topics?.name ?? r.subjects?.name ?? "Mixed GCSE challenge",
  }));
}
