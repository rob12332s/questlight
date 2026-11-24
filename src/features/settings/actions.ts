"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BOARDS } from "@/config/boards";
import { courseOptions } from "@/content/library";
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

  // Remove only unticked subjects and add new ones, so each subject's board, tier and
  // set texts survive a save.
  let removal = supabase.from("profile_subjects").delete().eq("profile_id", student.userId);
  if (chosen.length > 0) removal = removal.not("subject_id", "in", `(${chosen.join(",")})`);
  const { error: deleteError } = await removal;
  if (deleteError) return { status: "error", message: "We couldn't save your subjects. Try again." };
  if (chosen.length > 0) {
    const { error } = await supabase
      .from("profile_subjects")
      .upsert(
        chosen.map((subjectId) => ({ profile_id: student.userId, subject_id: subjectId })),
        { onConflict: "profile_id,subject_id", ignoreDuplicates: true },
      );
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

const TIERED = new Set(["maths", "biology", "chemistry", "physics", "combined-science"]);

/** Saves one subject's course details: exam board, tier, set texts or options, confidence. */
export async function updateCourse(_prev: FormState, formData: FormData): Promise<FormState> {
  const student = await getCurrentStudent();
  if (!student) return SIGNED_OUT;
  const subjectId = String(formData.get("subjectId") ?? "");
  const supabase = await getServerSupabase();
  const { data: subject } = await supabase.from("subjects").select("id, slug").eq("id", subjectId).maybeSingle();
  if (!subject) return { status: "error", message: "Choose a subject first." };
  const slug = (subject as { slug: string }).slug;

  const boardRaw = String(formData.get("board") ?? "");
  const board = (BOARDS as string[]).includes(boardRaw) ? boardRaw : null;
  const tierRaw = String(formData.get("tier") ?? "");
  const tier = TIERED.has(slug) && (tierRaw === "foundation" || tierRaw === "higher") ? tierRaw : null;
  const allowed = new Set(courseOptions(slug).map((o) => o.key));
  const options = [...new Set(formData.getAll("options").map(String))].filter((o) => allowed.has(o)).slice(0, 20);
  const confidenceRaw = Number(formData.get("confidence"));
  const confidence = Number.isInteger(confidenceRaw) && confidenceRaw >= 1 && confidenceRaw <= 5 ? confidenceRaw : null;

  const { data, error } = await supabase
    .from("profile_subjects")
    .update({ exam_board: board, tier, options, confidence })
    .eq("profile_id", student.userId)
    .eq("subject_id", subjectId)
    .select("subject_id");
  if (error) return { status: "error", message: "We couldn't save that. Try again." };
  if (!data || data.length === 0) return { status: "error", message: "Add this subject to your subjects first." };

  revalidatePath("/", "layout");
  return { status: "success", message: "Course saved." };
}
