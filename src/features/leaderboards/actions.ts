"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/server/session";

/** Shows or hides the student's display name on leaderboards. */
export async function setLeaderboardVisibility(formData: FormData): Promise<void> {
  const student = await getCurrentStudent();
  if (!student) redirect("/login?next=/leaderboards");
  const show = formData.get("show") === "true";
  const board = String(formData.get("board") ?? "week");
  const supabase = await getServerSupabase();
  await supabase.from("profiles").update({ show_on_leaderboards: show }).eq("id", student.userId);
  revalidatePath("/leaderboards");
  redirect(`/leaderboards?board=${encodeURIComponent(board)}`);
}
