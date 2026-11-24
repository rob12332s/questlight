"use client";

import { useActionState, useState } from "react";
import { FormAlert, SubmitButton } from "@/components/ui/form";
import { Segmented } from "@/components/ui/segmented";
import { createGame, joinGame, type PlayFormState } from "./actions";

interface SubjectChoice {
  id: string;
  name: string;
  topics: Array<{ id: string; name: string }>;
}

const DIFFICULTY_CHOICES = [
  { value: "mixed", label: "Mixed" },
  { value: "foundation", label: "Foundation" },
  { value: "standard", label: "Standard" },
  { value: "challenge", label: "Challenge" },
] as const;
const COUNTS = [5, 10] as const;
const SECONDS = [15, 20, 30] as const;

export function JoinGameForm({ initialCode }: { initialCode?: string }) {
  const [state, action] = useActionState<PlayFormState, FormData>(joinGame, {});
  const [code, setCode] = useState(() => (initialCode ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
  return (
    <form action={action} className="space-y-4">
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-ink">
          Game code
        </label>
        <input
          id="code"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          inputMode="text"
          placeholder="K7M2QX"
          aria-describedby="code-hint"
          className="tabular mt-2 block h-14 w-full rounded-md border border-line-strong bg-deep px-4 text-center text-2xl font-semibold tracking-[0.35em] text-ink uppercase placeholder:text-ink-muted/50 focus:border-beam focus:ring-2 focus:ring-beam/30 focus:outline-none"
        />
        <p id="code-hint" className="mt-2 text-sm text-ink-muted">
          Six letters and numbers, shown on the host&apos;s screen.
        </p>
      </div>
      <SubmitButton pendingLabel="Joining…" size="lg" className="w-full" disabled={code.length !== 6}>
        Join game
      </SubmitButton>
    </form>
  );
}

export function HostGameForm({ subjects }: { subjects: SubjectChoice[] }) {
  const [state, action] = useActionState<PlayFormState, FormData>(createGame, {});
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTY_CHOICES)[number]["value"]>("mixed");
  const [count, setCount] = useState<(typeof COUNTS)[number]>(10);
  const [seconds, setSeconds] = useState<(typeof SECONDS)[number]>(20);
  const first = subjects[0];

  return (
    <form action={action} className="space-y-6">
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      <div>
        <label htmlFor="scope" className="block text-sm font-medium text-ink">
          Questions from
        </label>
        <select
          id="scope"
          name="scope"
          defaultValue={first ? `${first.id}:all` : ""}
          className="mt-2 block h-11 w-full rounded-md border border-line-strong bg-deep px-3 text-ink focus:border-beam focus:ring-2 focus:ring-beam/30 focus:outline-none"
        >
          {subjects.map((subject) => (
            <optgroup key={subject.id} label={subject.name}>
              <option value={`${subject.id}:all`}>All of {subject.name}</option>
              {subject.topics.map((topic) => (
                <option key={topic.id} value={`${subject.id}:${topic.id}`}>
                  {topic.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <Segmented name="difficulty" legend="Difficulty" choices={DIFFICULTY_CHOICES} value={difficulty} onChange={setDifficulty} />
      <div className="grid gap-6 sm:grid-cols-2">
        <Segmented
          name="count"
          legend="Questions"
          choices={COUNTS.map((n) => ({ value: n, label: String(n) }))}
          value={count}
          onChange={setCount}
        />
        <Segmented
          name="seconds"
          legend="Time per question"
          choices={SECONDS.map((n) => ({ value: n, label: `${n}s` }))}
          value={seconds}
          onChange={setSeconds}
        />
      </div>
      <p className="text-sm text-ink-muted">
        A single topic has up to 7 live questions, so a 10-question game on one topic will be shorter.
      </p>
      <SubmitButton pendingLabel="Creating…" size="lg" className="w-full sm:w-auto">
        Create game
      </SubmitButton>
    </form>
  );
}
