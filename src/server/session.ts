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
 * The signed-in student for this request, or null. Cached per request.
 *
 * getClaims() verifies the JWT signature (locally with the project's public keys, or
 * via the auth server for older symmetric keys), so a forged cookie is rejected. The
 * profile query then runs under RLS with the same token, so it can only ever return
 * this student's own row.
 */
export const getCurrentStudent = cache(async (): Promise<CurrentStudent | null> => {
  if (!isSupabaseConfigured(process.env)) return null;
  const supabase = await getServerSupabase();
  const { data, error: claimsError } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (claimsError || !claims?.sub) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, education_stage, show_on_leaderboards, xp, account_type")
    .eq("id", claims.sub)
    .single();
  if (error || !profile) return null;

  const email = typeof claims.email === "string" ? claims.email : null;
  return { userId: claims.sub, email, profile: profile as ProfileRow };
});
