"use client";

import { useActionState, useState } from "react";
import { FormAlert, SubmitButton } from "@/components/ui/form";
import { createClass, joinClass, setWork, type ClassFormState } from "./actions";

export function JoinClassForm({ initialCode }: { initialCode?: string }) {
  const [state, action] = useActionState<ClassFormState, FormData>(joinClass, {});
  const [code, setCode] = useState(() => (initialCode ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
  return (
    <form action={action} className="space-y-4">
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      <div>
        <label htmlFor="class-code" className="block text-sm font-medium text-ink">
          Class code
        </label>
        <input
          id="class-code"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="K7M2QX"
          aria-describedby="class-code-hint"
          className="tabular mt-2 block h-14 w-full rounded-md border border-line-strong bg-deep px-4 text-center text-2xl font-semibold tracking-[0.35em] text-ink uppercase placeholder:text-ink-muted/50 focus:border-beam focus:ring-2 focus:ring-beam/30 focus:outline-none"
        />
        <p id="class-code-hint" className="mt-2 text-sm text-ink-muted">
          Your teacher and classmates will see your display name and how much XP you earn each week.
        </p>
      </div>
      <SubmitButton pendingLabel="Joining…" size="lg" className="w-full" disabled={code.length !== 6}>
        Join class
      </SubmitButton>
    </form>
  );
}

export function CreateClassForm() {
  const [state, action] = useActionState<ClassFormState, FormData>(createClass, {});
  return (
    <form action={action} className="space-y-4">
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      <div>
        <label htmlFor="class-name" className="block text-sm font-medium text-ink">
          Class name
        </label>
        <input
          id="class-name"
          name="name"
          required
          minLength={2}
          maxLength={60}
          placeholder="Year 10 Science, set 2"
          className="mt-2 block h-11 w-full rounded-md border border-line-strong bg-deep px-3 text-ink placeholder:text-ink-muted/60 focus:border-beam focus:ring-2 focus:ring-beam/30 focus:outline-none"
        />
      </div>
      <SubmitButton pendingLabel="Creating…">Create class</SubmitButton>
    </form>
  );
}

export function SetWorkForm({
  classId,
  subjects,
  minDate,
}: {
  classId: string;
  subjects: Array<{ id: string; name: string; topics: Array<{ id: string; name: string }> }>;
  minDate: string;
}) {
  const [state, action] = useActionState<ClassFormState, FormData>(setWork, {});
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-[1fr_11rem_auto] sm:items-end">
      <input type="hidden" name="classId" value={classId} />
      {state.error && (
        <div className="sm:col-span-3">
          <FormAlert tone="error">{state.error}</FormAlert>
        </div>
      )}
      <div>
        <label htmlFor="work-topic" className="block text-sm font-medium text-ink">
          Topic quiz
        </label>
        <select
          id="work-topic"
          name="topicId"
          required
          className="mt-2 block h-11 w-full rounded-md border border-line-strong bg-deep px-3 text-ink focus:border-beam focus:ring-2 focus:ring-beam/30 focus:outline-none"
        >
          {subjects.map((s) => (
            <optgroup key={s.id} label={s.name}>
              {s.topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="work-due" className="block text-sm font-medium text-ink">
          Due by the end of
        </label>
        <input
          id="work-due"
          name="due"
          type="date"
          required
          min={minDate}
          className="mt-2 block h-11 w-full rounded-md border border-line-strong bg-deep px-3 text-ink [color-scheme:inherit] focus:border-beam focus:ring-2 focus:ring-beam/30 focus:outline-none"
        />
      </div>
      <SubmitButton pendingLabel="Setting…">Set work</SubmitButton>
    </form>
  );
}
