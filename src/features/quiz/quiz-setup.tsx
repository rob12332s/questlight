"use client";

import { useActionState, useState } from "react";
import { FormAlert, SubmitButton } from "@/components/ui/form";
import { Segmented } from "@/components/ui/segmented";
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
