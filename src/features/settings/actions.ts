"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fieldErrors, profileSchema, type FormState } from "@/features/auth/schemas";
import { hasServiceRoleKey } from "@/lib/env";
import { getAdminSupabase, getServerSupabase } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/server/session";

const SIGNED_OUT: FormState = { status: "error", message: "Your session has ended. Log in again to continue." };

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const student = await getCurrentStudent();
  if (!student) return SIGNED_OUT;

  const parsed = profileSchema.safeParse({
    displayName: String(formData.get("displayName") ?? ""),
    educationStage: String(formData.get("educationStage") ?? ""),
    showOnLeaderboards: formData.get("showOnLeaderboards") === "on",
  });
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error) };

  // Runs as the student: RLS and column grants decide what may change.
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      education_stage: parsed.data.educationStage,
      show_on_leaderboards: parsed.data.showOnLeaderboards,
    })
    .eq("id", student.userId);
  if (error) return { status: "error", message: "We couldn't save your profile. Try again." };

  revalidatePath("/", "layout");
  return { status: "success", message: "Profile saved." };
}

export async function updateSubjects(_prev: FormState, formData: FormData): Promise<FormState> {
  const student = await getCurrentStudent();
  if (!student) return SIGNED_OUT;

  const supabase = await getServerSupabase();
  const { data: allSubjects, error: listError } = await supabase.from("subjects").select("id");
  if (listError) return { status: "error", message: "We couldn't load subjects. Try again." };

  // Only accept ids that really are subjects.
  const valid = new Set((allSubjects ?? []).map((s: { id: string }) => s.id));
  const chosen = formData.getAll("subjectId").map(String).filter((id) => valid.has(id));

  const { error: deleteError } = await supabase.from("profile_subjects").delete().eq("profile_id", student.userId);
  if (deleteError) return { status: "error", message: "We couldn't save your subjects. Try again." };
  if (chosen.length > 0) {
    const { error } = await supabase
      .from("profile_subjects")
      .insert(chosen.map((subjectId) => ({ profile_id: student.userId, subject_id: subjectId })));
    if (error) return { status: "error", message: "We couldn't save your subjects. Try again." };
  }

  revalidatePath("/", "layout");
  return {
    status: "success",
    message: chosen.length === 0 ? "Subjects cleared." : `Saved ${chosen.length} subject${chosen.length === 1 ? "" : "s"}.`,
  };
}

export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const student = await getCurrentStudent();
  if (!student) return SIGNED_OUT;

  if (String(formData.get("confirm") ?? "").trim().toLowerCase() !== "delete") {
    return { status: "error", errors: { confirm: "Type delete to confirm." } };
  }
  if (!hasServiceRoleKey(process.env)) {
    return { status: "error", message: "Account deletion isn't switched on for this site yet." };
  }

  // Deleting the auth user cascades to the profile and every table that references it.
  const admin = getAdminSupabase();
  const { error } = await admin.auth.admin.deleteUser(student.userId);
  if (error) return { status: "error", message: "We couldn't delete your account. Try again in a moment." };

  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  redirect("/login?deleted=1");
}
