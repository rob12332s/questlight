"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { DIFFICULTIES } from "@/domain/types";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/server/session";
import { gameErrorMessage, joinErrorMessage } from "./messages";

export interface PlayFormState {
  error?: string;
}

const createSchema = z.object({
  // "<subjectId>:all" for a whole subject, "<subjectId>:<topicId>", or "mixed" for every subject.
  scope: z
    .string()
    .regex(/^([0-9a-f-]{36}:([0-9a-f-]{36}|all)|mixed)$/i, "Choose a subject or topic."),
  difficulty: z.union([z.enum(DIFFICULTIES), z.literal("mixed")]),
  count: z.coerce.number().int().min(3).max(20),
  seconds: z.coerce.number().int().min(10).max(60),
  // Set when a teacher hosts a game for one of their classes.
  classroomId: z.string().uuid().optional(),
});

export async function createGame(_prev: PlayFormState, formData: FormData): Promise<PlayFormState> {
  const student = await getCurrentStudent();
  if (!student) redirect("/login?next=/play");

  const parsed = createSchema.safeParse({
    scope: formData.get("scope"),
    difficulty: formData.get("difficulty") ?? "mixed",
    count: formData.get("count") ?? 10,
    seconds: formData.get("seconds") ?? 20,
    classroomId: formData.get("classroomId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your choices." };

  const [subjectId, topic] = parsed.data.scope === "mixed" ? [null, "all"] : (parsed.data.scope.split(":") as [string, string]);
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.rpc("create_room", {
    p_subject: subjectId,
    p_topic: topic === "all" ? null : topic,
    p_difficulty: parsed.data.difficulty === "mixed" ? null : parsed.data.difficulty,
    p_count: parsed.data.count,
    p_seconds: parsed.data.seconds,
    p_classroom: parsed.data.classroomId ?? null,
  });
  const roomId = (data as { room_id?: string } | null)?.room_id;
  if (error || !roomId) return { error: gameErrorMessage(error?.hint) };
  redirect(`/play/${roomId}`);
}

export async function joinGame(_prev: PlayFormState, formData: FormData): Promise<PlayFormState> {
  const student = await getCurrentStudent();
  if (!student) redirect("/login?next=/play");

  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "Enter the six-character code from the host's screen." };

  const supabase = await getServerSupabase();
  const { data, error } = await supabase.rpc("join_room", { p_code: code });
  const result = data as { room_id?: string; error?: string } | null;
  if (error || !result) return { error: "Something went wrong. Try again." };
  if (!result.room_id) return { error: joinErrorMessage(result.error) };
  redirect(`/play/${result.room_id}`);
}
