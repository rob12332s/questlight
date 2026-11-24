"use client";

import { Swords } from "lucide-react";
import { useActionState } from "react";
import { createGame, type PlayFormState } from "./actions";

export interface Challenge {
  title: string;
  detail: string;
  /** "<subjectId>:<topicId|all>" or "mixed". */
  scope: string;
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const [state, action, pending] = useActionState<PlayFormState, FormData>(createGame, {});
  return (
    <form action={action} className="h-full">
      <input type="hidden" name="scope" value={challenge.scope} />
      <input type="hidden" name="difficulty" value="mixed" />
      <input type="hidden" name="count" value="10" />
      <input type="hidden" name="seconds" value="20" />
      <button
        type="submit"
        disabled={pending}
        className="group flex h-full w-full flex-col rounded-xl border border-line bg-deep p-4 text-left transition-colors hover:border-beam/50 disabled:opacity-60"
      >
        <span className="flex items-center gap-2 font-semibold">
          <Swords className="h-4 w-4 text-beam-bright" aria-hidden /> {challenge.title}
        </span>
        <span className="mt-1 text-sm text-ink-soft">{challenge.detail}</span>
        <span className="mt-3 text-xs text-ink-muted">{pending ? "Creating room…" : "10 questions · 20 seconds each"}</span>
        {state.error && (
          <span role="alert" className="mt-2 text-sm text-incorrect">
            {state.error}
          </span>
        )}
      </button>
    </form>
  );
}

export function Challenges({ challenges }: { challenges: Challenge[] }) {
  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {challenges.map((c) => (
        <li key={c.scope}>
          <ChallengeCard challenge={c} />
        </li>
      ))}
    </ul>
  );
}
