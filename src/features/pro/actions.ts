"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/server/session";

export type SimState = { message?: string; error?: string };

const STATES = ["free", "active", "pending", "cancelled", "expired", "failed"] as const;

/**
 * TEST MODE ONLY. Puts the signed-in student's own subscription into a chosen state so
 * Pro access can be tested without real payments. Needs PAYMENTS_TEST_MODE=1 here AND
 * the test database's private_settings row payments_test_mode = 'on'; the database refuses otherwise.
 */
export async function simulateSubscription(_prev: SimState, formData: FormData): Promise<SimState> {
  if (process.env.PAYMENTS_TEST_MODE !== "1") return { error: "Test mode is off on this site." };
  const student = await getCurrentStudent();
  if (!student) return { error: "Log in first." };
  const status = String(formData.get("status"));
  if (!STATES.includes(status as (typeof STATES)[number])) return { error: "Unknown state." };
  const supabase = await getServerSupabase();
  const { error } = await supabase.rpc("simulate_subscription", { p_status: status });
  if (error) return { error: error.hint === "test_mode_off" ? "Test mode is off in the database." : "That didn't work. Try again." };
  revalidatePath("/", "layout");
  return { message: `Test subscription set to “${status}”.` };
}
