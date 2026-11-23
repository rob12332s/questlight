import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { parsePublicEnv, parseServiceRoleKey } from "@/lib/env";

/**
 * Request-scoped client acting AS the signed-in user (RLS applies).
 * Use this for almost everything, including calling game RPCs — the database
 * functions read auth.uid() and enforce the rules themselves.
 */
export async function getServerSupabase() {
  const env = parsePublicEnv(process.env);
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component: cookies are read-only there. The proxy refreshes sessions.
        }
      },
    },
  });
}

/**
 * Service-role client. BYPASSES Row Level Security.
 * Only for narrowly scoped admin tasks (account deletion, writing AI usage logs).
 * Never pass its results to the client without filtering.
 */
export function getAdminSupabase() {
  const env = parsePublicEnv(process.env);
  return createClient(env.supabaseUrl, parseServiceRoleKey(process.env), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
