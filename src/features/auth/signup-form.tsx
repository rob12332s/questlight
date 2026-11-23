"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Checkbox, Field, FormAlert, Input, Select, SubmitButton } from "@/components/ui/form";
import { EDUCATION_STAGE_LABELS, EDUCATION_STAGES, LAUNCH_STAGES } from "@/domain/types";
import { signUp } from "./actions";
import { initialFormState } from "./schemas";

export function SignUpForm({ configured }: { configured: boolean }) {
  const [state, action] = useActionState(signUp, initialFormState);
  const errors = state.errors ?? {};
  const values = state.values ?? {};

  if (state.status === "success") {
    return (
      <FormAlert tone="success">
        <p className="font-medium">Check your email</p>
        <p className="mt-1 text-ink-soft">{state.message}</p>
      </FormAlert>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      {!configured && (
        <FormAlert tone="error">
          Sign-up isn&apos;t switched on for this site yet. The form is shown so you can see what we ask for.
        </FormAlert>
      )}
      {state.status === "error" && state.message && <FormAlert tone="error">{state.message}</FormAlert>}

      <Field label="Display name" hint="Shown to other players. Don't use your full real name." error={errors.displayName}>
        {(props) => (
          <Input {...props} name="displayName" autoComplete="nickname" maxLength={24} defaultValue={values.displayName} required />
        )}
      </Field>

      <Field label="Email" hint="Only used to log in. Never shown to anyone." error={errors.email}>
        {(props) => <Input {...props} name="email" type="email" autoComplete="email" defaultValue={values.email} required />}
      </Field>

      <Field label="Password" hint="At least 8 characters." error={errors.password}>
        {(props) => <Input {...props} name="password" type="password" autoComplete="new-password" minLength={8} required />}
      </Field>

      <Field label="Stage" hint="Content is available for GCSE first." error={errors.educationStage}>
        {(props) => (
          <Select {...props} name="educationStage" defaultValue={values.educationStage || "gcse"}>
            {EDUCATION_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {EDUCATION_STAGE_LABELS[stage]}
                {LAUNCH_STAGES.includes(stage) ? "" : " (content coming later)"}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Checkbox
        name="ageConfirmed"
        error={errors.ageConfirmed}
        label={
          <>
            I&apos;m 13 or older, and I agree to the{" "}
            <Link href="/terms" className="text-ink underline underline-offset-4" target="_blank">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-ink underline underline-offset-4" target="_blank">
              privacy notice
            </Link>
            .
          </>
        }
      />

      <SubmitButton pendingLabel="Creating account…" size="lg" className="w-full" disabled={!configured}>
        Create account
      </SubmitButton>
    </form>
  );
}
