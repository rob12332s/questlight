import "server-only";

import { cache } from "react";
import type { EducationStage } from "@/domain/types";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";

export interface ProfileRow {
  id: string;
  display_name: string;
  education_stage: EducationStage | null;
  show_on_leaderboards: boolean;
  xp: number;
  account_type: "student" | "teacher";
}

export interface CurrentStudent {
  userId: string;
  email: string | null;
  profile: ProfileRow;
}

/**
 * The signed-in student for this request, or null. Uses getUser(), which validates
 * the session with Supabase rather than trusting the cookie. Cached per request.
 */
export const getCurrentStudent = cache(async (): Promise<CurrentStudent | null> => {
  if (!isSupabaseConfigured(process.env)) return null;
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, education_stage, show_on_leaderboards, xp, account_type")
    .eq("id", user.id)
    .single();
  if (error || !profile) return null;

  return { userId: user.id, email: user.email ?? null, profile: profile as ProfileRow };
});
