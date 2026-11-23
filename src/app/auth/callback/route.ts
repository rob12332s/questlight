import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/redirects";
import { getServerSupabase } from "@/lib/supabase/server";

/**
 * Landing point for links in Supabase emails (sign-up confirmation).
 * Handles both the PKCE `code` flow and the `token_hash` template flow.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"));
  const failure = NextResponse.redirect(new URL("/login?error=link", url.origin));

  if (!isSupabaseConfigured(process.env)) return failure;
  const supabase = await getServerSupabase();

  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return error ? failure : NextResponse.redirect(new URL(next, url.origin));
  }

  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    return error ? failure : NextResponse.redirect(new URL(next, url.origin));
  }

  return failure;
}
