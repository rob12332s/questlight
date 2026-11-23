"use client";

import { useActionState } from "react";
import { SubjectIcon } from "@/components/subject-icon";
import { Checkbox, Field, FormAlert, Input, Select, SubmitButton } from "@/components/ui/form";
import { EDUCATION_STAGE_LABELS, EDUCATION_STAGES, type EducationStage } from "@/domain/types";
import { initialFormState } from "@/features/auth/schemas";
import { deleteAccount, updateProfile, updateSubjects } from "./actions";

function Result({ state }: { state: { status: string; message?: string } }) {
  if (!state.message || state.status === "idle") return null;
  return <FormAlert tone={state.status === "success" ? "success" : "error"}>{state.message}</FormAlert>;
}

export function ProfileForm({
  displayName,
  educationStage,
  showOnLeaderboards,
}: {
  displayName: string;
  educationStage: EducationStage | null;
  showOnLeaderboards: boolean;
}) {
  const [state, action] = useActionState(updateProfile, initialFormState);
  const errors = state.errors ?? {};
  return (
    <form action={action} className="space-y-5">
      <Result state={state} />
      <Field label="Display name" hint="What other players see." error={errors.displayName}>
        {(props) => <Input {...props} name="displayName" defaultValue={displayName} maxLength={24} required />}
      </Field>
      <Field label="Stage" error={errors.educationStage}>
        {(props) => (
          <Select {...props} name="educationStage" defaultValue={educationStage ?? "gcse"}>
            {EDUCATION_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {EDUCATION_STAGE_LABELS[stage]}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Checkbox
        name="showOnLeaderboards"
        defaultChecked={showOnLeaderboards}
        label="Show my display name on shared leaderboards"
      />
      <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
    </form>
  );
}

export function SubjectsForm({
  subjects,
  selected,
}: {
  subjects: Array<{ id: string; slug: string; name: string }>;
  selected: string[];
}) {
  const [state, action] = useActionState(updateSubjects, initialFormState);
  return (
    <form action={action} className="space-y-5">
      <Result state={state} />
      <fieldset>
        <legend className="sr-only">Subjects</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {subjects.map((subject) => (
            <label
              key={subject.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-line px-3 py-3 transition-colors hover:border-line-strong has-[:checked]:border-beam/60 has-[:checked]:bg-beam-wash"
            >
              <input
                type="checkbox"
                name="subjectId"
                value={subject.id}
                defaultChecked={selected.includes(subject.id)}
                className="h-4 w-4 accent-beam"
              />
              <SubjectIcon slug={subject.slug} className="h-[18px] w-[18px] text-ink-muted" />
              <span>{subject.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <SubmitButton pendingLabel="Saving…">Save subjects</SubmitButton>
    </form>
  );
}

export function DeleteAccountForm({ enabled }: { enabled: boolean }) {
  const [state, action] = useActionState(deleteAccount, initialFormState);
  return (
    <form action={action} className="space-y-4">
      <Result state={state} />
      {!enabled && (
        <FormAlert tone="error">Account deletion isn&apos;t switched on for this site yet. The site owner needs to add the server key.</FormAlert>
      )}
      <Field label='Type "delete" to confirm' error={state.errors?.confirm}>
        {(props) => <Input {...props} name="confirm" autoComplete="off" disabled={!enabled} />}
      </Field>
      <SubmitButton pendingLabel="Deleting…" variant="secondary" disabled={!enabled} className="text-incorrect">
        Delete my account permanently
      </SubmitButton>
    </form>
  );
}
