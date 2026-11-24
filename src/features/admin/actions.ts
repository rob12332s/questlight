"use server";

import { revalidatePath } from "next/cache";
import { validateLesson } from "@/domain/lesson";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/server/session";

/**
 * Content admin actions. Every check happens again in the database (is_content_admin),
 * so these can't be used by anyone else. Lessons are validated here before saving, and
 * nothing is published unless an admin explicitly chooses "Published".
 */
export type AdminState = { message?: string; error?: string; problems?: string[] };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function updateTopic(_prev: AdminState, formData: FormData): Promise<AdminState> {
  if (!(await getCurrentStudent())) return { error: "Log in again." };
  const topicId = String(formData.get("topicId") ?? "");
  const verification = String(formData.get("verification"));
  const access = String(formData.get("access"));
  const contentStatus = String(formData.get("contentStatus"));
  const published = formData.get("published") === "on";
  if (!UUID.test(topicId) || !["verified", "awaiting_verification"].includes(verification) || !["free", "pro"].includes(access) || !["lesson", "practice", "planned"].includes(contentStatus)) {
    return { error: "Check the values and try again." };
  }
  const supabase = await getServerSupabase();
  const { error } = await supabase.rpc("admin_update_topic", {
    p_topic: topicId,
    p_verification: verification,
    p_access: access,
    p_content_status: contentStatus,
    p_published: published,
  });
  if (error) return { error: error.hint === "not_admin" ? "Only content admins can do this." : "That didn't save." };
  revalidatePath("/admin/content");
  revalidatePath("/library", "layout");
  return { message: "Saved." };
}

export async function saveLesson(_prev: AdminState, formData: FormData): Promise<AdminState> {
  if (!(await getCurrentStudent())) return { error: "Log in again." };
  const topicId = String(formData.get("topicId") ?? "");
  const status = String(formData.get("status"));
  const note = String(formData.get("note") ?? "").slice(0, 1000) || null;
  if (!UUID.test(topicId) || !["draft", "in_review", "published"].includes(status)) return { error: "Check the values and try again." };
  let content: unknown;
  try {
    content = JSON.parse(String(formData.get("content") ?? ""));
  } catch {
    return { error: "The lesson isn't valid JSON." };
  }
  const problems = validateLesson(content);
  if (problems.length > 0) return { error: "The lesson has problems. Fix them and save again.", problems };
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.rpc("admin_save_lesson", { p_topic: topicId, p_content: content, p_status: status, p_note: note });
  if (error) return { error: error.hint === "not_admin" ? "Only content admins can do this." : "That didn't save." };
  revalidatePath("/admin/content");
  revalidatePath("/library", "layout");
  return { message: `Saved as ${status.replace("_", " ")} (version ${data}).` };
}
