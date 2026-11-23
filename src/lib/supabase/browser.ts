"use client";

import { createBrowserClient } from "@supabase/ssr";
import { parsePublicEnv } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient> | undefined;

/** Browser client — uses the anon key only; every query is subject to Row Level Security. */
export function getBrowserSupabase() {
  if (!client) {
    const env = parsePublicEnv({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    });
    client = createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
  }
  return client;
}
