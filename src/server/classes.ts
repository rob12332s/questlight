import "server-only";

import { getServerSupabase } from "@/lib/supabase/server";

export interface ClassSummary {
  id: string;
  name: string;
  code: string | null;
  isTeacher: boolean;
  archived: boolean;
}

/** Classes the student is in, or teaches (RLS: teacher or member only). */
export async function getMyClasses(userId: string): Promise<ClassSummary[]> {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("classrooms")
    .select("id, name, class_code, teacher_id, archived_at")
    .order("created_at", { ascending: false });
  return ((data ?? []) as Array<{ id: string; name: string; class_code: string; teacher_id: string; archived_at: string | null }>).map(
    (c) => ({
      id: c.id,
      name: c.name,
      isTeacher: c.teacher_id === userId,
      // Students don't need the code once they've joined; it's shown to the teacher only.
      code: c.teacher_id === userId ? c.class_code : null,
      archived: c.archived_at !== null,
    }),
  );
}
