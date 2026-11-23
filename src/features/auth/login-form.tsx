"use client";

import { useActionState } from "react";
import { Field, FormAlert, Input, SubmitButton } from "@/components/ui/form";
import { logIn } from "./actions";
import { initialFormState } from "./schemas";

export function LogInForm({
  configured,
  next,
  notice,
}: {
  configured: boolean;
  next: string;
  notice?: { tone: "error" | "success"; text: string };
}) {
  const [state, action] = useActionState(logIn, initialFormState);
  const errors = state.errors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />
      {!configured && <FormAlert tone="error">Logging in isn&apos;t switched on for this site yet.</FormAlert>}
      {notice && state.status === "idle" && <FormAlert tone={notice.tone}>{notice.text}</FormAlert>}
      {state.status === "error" && state.message && <FormAlert tone="error">{state.message}</FormAlert>}

      <Field label="Email" error={errors.email}>
        {(props) => (
          <Input {...props} name="email" type="email" autoComplete="email" defaultValue={state.values?.email} required />
        )}
      </Field>
      <Field label="Password" error={errors.password}>
        {(props) => <Input {...props} name="password" type="password" autoComplete="current-password" required />}
      </Field>

      <SubmitButton pendingLabel="Logging in…" size="lg" className="w-full" disabled={!configured}>
        Log in
      </SubmitButton>
    </form>
  );
}
