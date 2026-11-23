import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/features/auth/signup-form";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Create an account" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold">Create your account</h1>
      <p className="mt-2 text-ink-soft">Free. You only need a display name and an email.</p>
      <div className="mt-8">
        <SignUpForm configured={isSupabaseConfigured(process.env)} />
      </div>
      <p className="mt-8 text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ink underline underline-offset-4">
          Log in
        </Link>
      </p>
    </>
  );
}
