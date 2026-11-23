import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/features/auth/password-forms";
import { getCurrentStudent } from "@/server/session";

export const metadata: Metadata = { title: "Choose a new password" };

/** Reached from the reset email via /auth/callback, which signs the student in first. */
export default async function ResetPasswordPage() {
  const student = await getCurrentStudent();
  return (
    <>
      <h1 className="text-3xl font-semibold">Choose a new password</h1>
      {student ? (
        <>
          <p className="mt-2 text-ink-soft">You&apos;ll use it the next time you log in.</p>
          <div className="mt-8">
            <ResetPasswordForm />
          </div>
        </>
      ) : (
        <p className="mt-4 text-ink-soft">
          This page needs the link from your reset email.{" "}
          <Link href="/forgot-password" className="font-medium text-ink underline underline-offset-4">
            Request a new link
          </Link>
          .
        </p>
      )}
    </>
  );
}
