"use client";

import { useActionState, useState } from "react";
import { FormAlert, SubmitButton } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { startQuiz, type StartQuizState } from "./actions";

interface Subject {
  id: string;
  name: string;
  topics: Array<{ id: string; name: string; questionCount: number }>;
}

const DIFFICULTY_CHOICES = [
  { value: "mixed", label: "Mixed" },
  { value: "foundation", label: "Foundation" },
  { value: "standard", label: "Standard" },
  { value: "challenge", label: "Challenge" },
] as const;
const LENGTHS = [5, 8, 10] as const;

function Segmented<T extends string | number>({
  name,
  legend,
  choices,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  choices: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink">{legend}</legend>
      <div
        className={cn(
          "mt-2 grid gap-1 rounded-lg bg-deep p-1 shadow-[inset_0_0_0_1px_var(--color-line)]",
          // Four longer labels don't fit in one row on a phone.
          choices.length > 3 ? "grid-cols-2 sm:grid-cols-4" : "auto-cols-fr grid-flow-col",
        )}
      >
        {choices.map((choice) => (
          <label
            key={String(choice.value)}
            className={cn(
              "relative flex h-10 cursor-pointer items-center justify-center rounded-md px-2 text-sm font-medium transition-colors duration-200",
              value === choice.value ? "bg-slate-raised text-ink shadow-raised" : "text-ink-soft hover:text-ink",
            )}
          >
            <input
              type="radio"
              name={name}
              value={String(choice.value)}
              checked={value === choice.value}
              onChange={() => onChange(choice.value)}
              className="sr-only"
            />
            {choice.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function QuizSetup({ subjects, initialTopicId }: { subjects: Subject[]; initialTopicId?: string }) {
  const [state, action] = useActionState<StartQuizState, FormData>(startQuiz, {});
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTY_CHOICES)[number]["value"]>("mixed");
  const [length, setLength] = useState<(typeof LENGTHS)[number]>(8);
  const firstTopic = subjects.flatMap((s) => s.topics)[0]?.id ?? "";

  return (
    <form action={action} className="space-y-6">
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      <div>
        <label htmlFor="topicId" className="block text-sm font-medium text-ink">
          Topic
        </label>
        <select
          id="topicId"
          name="topicId"
          defaultValue={initialTopicId ?? firstTopic}
          className="mt-2 block h-11 w-full rounded-md border border-line-strong bg-deep px-3 text-ink focus:border-beam focus:ring-2 focus:ring-beam/30 focus:outline-none"
        >
          {subjects
            .filter((s) => s.topics.length > 0)
            .map((subject) => (
              <optgroup key={subject.id} label={subject.name}>
                {subject.topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name} ({topic.questionCount} questions)
                  </option>
                ))}
              </optgroup>
            ))}
        </select>
      </div>
      <Segmented name="difficulty" legend="Difficulty" choices={DIFFICULTY_CHOICES} value={difficulty} onChange={setDifficulty} />
      <Segmented
        name="length"
        legend="Questions"
        choices={LENGTHS.map((n) => ({ value: n, label: String(n) }))}
        value={length}
        onChange={setLength}
      />
      <SubmitButton pendingLabel="Starting…" size="lg" className="w-full sm:w-auto">
        Start quiz
      </SubmitButton>
    </form>
  );
}
