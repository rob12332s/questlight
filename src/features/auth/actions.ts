"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/redirects";
import { getSiteUrl } from "@/server/site-url";
import { fieldErrors, logInSchema, signUpSchema, type FormState } from "./schemas";

const NOT_CONFIGURED: FormState = {
  status: "error",
  message: "Accounts aren't switched on for this site yet. The site owner needs to connect Supabase.",
};

/** Maps Supabase auth error codes to plain messages. Never reveals whether an email is registered. */
function authMessage(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return "That email and password don't match. Check them and try again.";
    case "email_not_confirmed":
      return "Confirm your email first. We sent you a link when you signed up.";
    case "weak_password":
      return "Choose a stronger password: at least 8 characters, ideally a short phrase.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Wait a minute, then try again.";
    case "signup_disabled":
      return "New sign-ups are paused right now.";
    default:
      return "Something went wrong on our side. Try again in a moment.";
  }
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = {
    displayName: String(formData.get("displayName") ?? ""),
    email: String(formData.get("email") ?? ""),
    educationStage: String(formData.get("educationStage") ?? ""),
  };
  if (!isSupabaseConfigured(process.env)) return { ...NOT_CONFIGURED, values };

  const parsed = signUpSchema.safeParse({
    ...values,
    password: String(formData.get("password") ?? ""),
    ageConfirmed: formData.get("ageConfirmed") ?? undefined,
  });
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values };

  const supabase = await getServerSupabase();
  const siteUrl = await getSiteUrl();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
      // Only these two values are read by the database trigger; both are re-validated there.
      data: { display_name: parsed.data.displayName, education_stage: parsed.data.educationStage },
    },
  });

  if (error) return { status: "error", message: authMessage(error.code), values };

  // Email confirmation off: we already have a session.
  if (data.session) redirect("/dashboard");

  // Email confirmation on. The same message shows whether or not the email was
  // already registered, so the form can't be used to discover who has an account.
  return {
    status: "success",
    message: `We've sent a confirmation link to ${parsed.data.email}. Open it on this device to finish signing up.`,
  };
}

export async function logIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: String(formData.get("email") ?? "") };
  if (!isSupabaseConfigured(process.env)) return { ...NOT_CONFIGURED, values };

  const parsed = logInSchema.safeParse({ ...values, password: String(formData.get("password") ?? "") });
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values };

  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { status: "error", message: authMessage(error.code), values };

  redirect(safeNextPath(formData.get("next")));
}

export async function logOut(): Promise<void> {
  if (isSupabaseConfigured(process.env)) {
    const supabase = await getServerSupabase();
    await supabase.auth.signOut();
  }
  redirect("/login?signedOut=1");
}
