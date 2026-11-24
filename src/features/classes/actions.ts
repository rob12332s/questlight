"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/server/session";

export interface ClassFormState {
  error?: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function joinMessage(code: string | undefined): string {
  switch (code) {
    case "invalid_code":
      return "Class codes are six letters and numbers, like K7M2QX. Check it with your teacher.";
    case "not_found":
      return "No class has that code. Your teacher may have changed it.";
    case "full":
      return "That class is full. Ask your teacher.";
    case "rate_limited":
      return "Too many tries in the last few minutes. Wait a little, then try again.";
    default:
      return "Something went wrong. Try again.";
  }
}

async function requireStudent(next: string) {
  const student = await getCurrentStudent();
  if (!student) redirect(`/login?next=${encodeURIComponent(next)}`);
  return student;
}

export async function createClass(_prev: ClassFormState, formData: FormData): Promise<ClassFormState> {
  await requireStudent("/classes");
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 60) return { error: "Give the class a name of 2 to 60 characters." };
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.rpc("create_classroom", { p_name: name });
  const id = (data as { classroom_id?: string } | null)?.classroom_id;
  if (error || !id) {
    if (error?.hint === "not_teacher") return { error: "Only teacher accounts can create classes." };
    if (error?.hint === "too_many_classes") return { error: "You have 30 active classes. Archive one to make another." };
    return { error: "We couldn't create the class. Try again." };
  }
  redirect(`/classes/${id}`);
}

export async function joinClass(_prev: ClassFormState, formData: FormData): Promise<ClassFormState> {
  await requireStudent("/classes");
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "Enter the class code from your teacher." };
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.rpc("join_classroom", { p_code: code });
  const result = data as { classroom_id?: string; error?: string } | null;
  if (error || !result) return { error: "Something went wrong. Try again." };
  if (!result.classroom_id) return { error: joinMessage(result.error) };
  redirect(`/classes/${result.classroom_id}`);
}

function classId(formData: FormData): string {
  const id = String(formData.get("classId") ?? "");
  if (!UUID.test(id)) redirect("/classes");
  return id;
}

export async function leaveClass(formData: FormData): Promise<void> {
  await requireStudent("/classes");
  const id = classId(formData);
  const supabase = await getServerSupabase();
  await supabase.rpc("leave_classroom", { p_class: id });
  revalidatePath("/classes");
  redirect("/classes?left=1");
}

export async function removeStudent(formData: FormData): Promise<void> {
  await requireStudent("/classes");
  const id = classId(formData);
  const studentId = String(formData.get("studentId") ?? "");
  if (!UUID.test(studentId)) redirect(`/classes/${id}`);
  const supabase = await getServerSupabase();
  await supabase.rpc("remove_classroom_member", { p_class: id, p_student: studentId });
  revalidatePath(`/classes/${id}`);
  redirect(`/classes/${id}`);
}

export async function resetClassCode(formData: FormData): Promise<void> {
  await requireStudent("/classes");
  const id = classId(formData);
  const supabase = await getServerSupabase();
  await supabase.rpc("reset_class_code", { p_class: id });
  revalidatePath(`/classes/${id}`);
  redirect(`/classes/${id}?codeReset=1`);
}

export async function archiveClass(formData: FormData): Promise<void> {
  await requireStudent("/classes");
  const id = classId(formData);
  if (formData.get("confirm") !== "archive") redirect(`/classes/${id}`);
  const supabase = await getServerSupabase();
  await supabase.rpc("archive_classroom", { p_class: id });
  revalidatePath("/classes");
  redirect("/classes?archived=1");
}
