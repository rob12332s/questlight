import type { Metadata } from "next";
import Link from "next/link";
import { LogInForm } from "@/features/auth/login-form";
import { isSupabaseConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/redirects";

export const metadata: Metadata = { title: "Log in" };

const NOTICES: Record<string, string> = {
  signedOut: "You've logged out.",
  confirmed: "Your email is confirmed. Log in to continue.",
  deleted: "Your account and its data have been deleted.",
};

export default async function LogInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const notice = Object.keys(NOTICES).find((key) => params[key] !== undefined);
  const authError =
    params.error === "link"
      ? { tone: "error" as const, text: "We couldn't finish signing you in from that link. If you've just confirmed your email, log in below. Opening the link in a different browser can cause this." }
      : undefined;

  return (
    <>
      <h1 className="text-3xl font-semibold">Log in</h1>
      <p className="mt-2 text-ink-soft">Welcome back.</p>
      <div className="mt-8">
        <LogInForm
          configured={isSupabaseConfigured(process.env)}
          next={safeNextPath(params.next)}
          notice={authError ?? (notice ? { tone: "success", text: NOTICES[notice]! } : undefined)}
        />
      </div>
      <p className="mt-8 text-sm text-ink-soft">
        New to Questlight?{" "}
        <Link href="/signup" className="font-medium text-ink underline underline-offset-4">
          Create a free account
        </Link>
      </p>
    </>
  );
}
