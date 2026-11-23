"use client";

import { useActionState } from "react";
import { Field, FormAlert, Input, SubmitButton } from "@/components/ui/form";
import { requestPasswordReset, updatePassword } from "./actions";
import { initialFormState } from "./schemas";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, initialFormState);
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
      {state.status === "error" && state.message && <FormAlert tone="error">{state.message}</FormAlert>}
      <Field label="Email" error={state.errors?.email}>
        {(props) => <Input {...props} name="email" type="email" autoComplete="email" defaultValue={state.values?.email} required />}
      </Field>
      <SubmitButton pendingLabel="Sending…" size="lg" className="w-full">
        Send reset link
      </SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, initialFormState);
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.status === "error" && state.message && <FormAlert tone="error">{state.message}</FormAlert>}
      <Field label="New password" hint="At least 8 characters." error={state.errors?.password}>
        {(props) => <Input {...props} name="password" type="password" autoComplete="new-password" minLength={8} required />}
      </Field>
      <Field label="Type it again" error={state.errors?.confirm}>
        {(props) => <Input {...props} name="confirm" type="password" autoComplete="new-password" required />}
      </Field>
      <SubmitButton pendingLabel="Saving…" size="lg" className="w-full">
        Save new password
      </SubmitButton>
    </form>
  );
}
