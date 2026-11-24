"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, BookOpen, Check, Layers, ListChecks, Sparkles, X } from "lucide-react";
import { useActionState, useState } from "react";
import { AnswerOption, type OptionState } from "@/components/learning/answer-option";
import { Button } from "@/components/ui/button";
import { FormAlert, SubmitButton } from "@/components/ui/form";
import { Segmented } from "@/components/ui/segmented";
import { AI_INPUT_LIMITS } from "@/domain/ai-content";
import type { ValidatedQuestion } from "@/domain/question-validation";
import { cn } from "@/lib/cn";
import {
  explainTopic,
  generateFlashcards,
  generatePractice,
  type ExplainState,
  type FlashcardState,
  type PracticeState,
} from "./actions";

interface Subject {
  id: string;
  name: string;
  topics: Array<{ id: string; name: string }>;
}
export interface Usage {
  explanation: number;
  questions: number;
  flashcards: number;
  limits: { explanation: number; questions: number; flashcards: number };
}

const EASE = [0.22, 1, 0.36, 1] as const;
const TOOLS = [
  { id: "explain", label: "Explain", icon: BookOpen },
  { id: "practice", label: "Practice questions", icon: ListChecks },
  { id: "flashcards", label: "Flashcards", icon: Layers },
] as const;
type Tool = (typeof TOOLS)[number]["id"];

function TopicSelect({ subjects, value, onChange }: { subjects: Subject[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor="ai-topic" className="block text-sm font-medium text-ink">
        Topic
      </label>
      <select
        id="ai-topic"
        name="topicId"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
  );
}

function AiLabel() {
  return (
    <p className="flex items-start gap-2 text-xs text-ink-muted">
      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-beam-bright" aria-hidden />
      Written by AI. It can make mistakes, so check important facts against your notes or with your teacher.
    </p>
  );
}

function ExplainTool({ subjects, topicId, setTopicId }: { subjects: Subject[]; topicId: string; setTopicId: (v: string) => void }) {
  const [state, action] = useActionState<ExplainState, FormData>(explainTopic, {});
  const [level, setLevel] = useState<"simple" | "standard" | "detailed">("standard");
  const [question, setQuestion] = useState("");
  return (
    <div className="space-y-8">
      <form action={action} className="space-y-5">
        {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
        <TopicSelect subjects={subjects} value={topicId} onChange={setTopicId} />
        <div>
          <label htmlFor="ai-question" className="block text-sm font-medium text-ink">
            Your question
          </label>
          <textarea
            id="ai-question"
            name="question"
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={AI_INPUT_LIMITS.questionMax}
            placeholder="For example: why does osmosis need a partially permeable membrane?"
            className="mt-2 block w-full resize-y rounded-md border border-line-strong bg-deep px-3 py-2.5 text-ink placeholder:text-ink-muted/70 focus:border-beam focus:ring-2 focus:ring-beam/30 focus:outline-none"
          />
          <p className="tabular mt-1.5 text-right text-xs text-ink-muted">
            {question.length}/{AI_INPUT_LIMITS.questionMax}
          </p>
        </div>
        <Segmented
          name="level"
          legend="How much detail?"
          choices={[
            { value: "simple", label: "Simple" },
            { value: "standard", label: "GCSE" },
            { value: "detailed", label: "In depth" },
          ]}
          value={level}
          onChange={setLevel}
        />
        <SubmitButton pendingLabel="Thinking…" disabled={question.trim().length < AI_INPUT_LIMITS.questionMin}>
          Explain it <ArrowRight className="h-4 w-4" aria-hidden />
        </SubmitButton>
      </form>

      {state.result && (
        <motion.article
          key={state.result.question}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          aria-labelledby="ai-answer"
          className="rounded-xl bg-paper p-5 text-paper-ink shadow-paper sm:p-7"
        >
          <p className="text-xs text-paper-ink-soft">{state.result.topic}</p>
          <h2 id="ai-answer" className="mt-1 text-lg font-semibold">
            {state.result.question}
          </h2>
          <div className="mt-4 space-y-3 leading-relaxed">
            {state.result.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {state.result.keyPoints.length > 0 && (
            <>
              <h3 className="mt-6 text-sm font-semibold">Key points</h3>
              <ul className="mt-2 space-y-1.5">
                {state.result.keyPoints.map((k, i) => (
                  <li key={i} className="flex gap-2">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-correct" aria-hidden strokeWidth={2.5} />
                    {k}
                  </li>
                ))}
              </ul>
            </>
          )}
          {state.result.checkQuestion && (
            <p className="mt-6 rounded-lg bg-beam/10 p-3 text-sm">
              <span className="font-semibold">Test yourself: </span>
              {state.result.checkQuestion}
            </p>
          )}
          <div className="mt-6 border-t border-paper-line pt-4 [&_p]:text-paper-ink-soft">
            <AiLabel />
          </div>
        </motion.article>
      )}
    </div>
  );
}

function PracticeSet({ questions, topic }: { questions: ValidatedQuestion[]; topic: string }) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const q = questions[index];
  const done = index >= questions.length;
  const score = questions.filter((qq, i) => answers[i] === qq.correctOptionId).length;

  if (done || !q) {
    return (
      <div className="rounded-xl border border-line bg-deep p-6" role="status">
        <p className="text-sm text-ink-muted">{topic}: AI practice</p>
        <p className="tabular mt-2 text-3xl font-semibold">
          {score}/{questions.length}
        </p>
        <p className="mt-2 text-sm text-ink-soft">AI practice is just for you: it doesn&apos;t change your XP or progress.</p>
        <Button className="mt-5" variant="secondary" onClick={() => {
            setAnswers({});
            setIndex(0);
          }}>
          Try these again
        </Button>
      </div>
    );
  }

  const chosen = answers[index];
  const state = (id: string): OptionState =>
    !chosen ? "idle" : id === chosen ? (id === q.correctOptionId ? "correct" : "incorrect") : id === q.correctOptionId ? "missed" : "dimmed";

  return (
    <div>
      <p className="tabular text-sm text-ink-soft" aria-live="polite">
        AI practice, question {index + 1} of {questions.length}
      </p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          key={index}
          aria-labelledby={`aiq-${index}`}
          initial={reduceMotion ? false : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, x: -20 }}
          transition={{ duration: 0.24, ease: EASE }}
          className="mt-3 rounded-xl bg-paper p-5 text-paper-ink shadow-paper sm:p-7"
        >
          <h3 id={`aiq-${index}`} className="text-lg leading-snug font-semibold">
            {q.text}
          </h3>
          <div className="mt-5 grid gap-2" role="group" aria-label="Answer options">
            {q.options.map((o) => (
              <AnswerOption
                key={o.id}
                option={o}
                state={state(o.id)}
                disabled={Boolean(chosen)}
                onSelect={(id) => setAnswers((a) => ({ ...a, [index]: id }))}
              />
            ))}
          </div>
          {chosen && (
            <div className="mt-5 border-t border-paper-line pt-4">
              <p className="flex items-center gap-2 font-semibold">
                {chosen === q.correctOptionId ? (
                  <>
                    <Check className="h-5 w-5 text-correct" aria-hidden strokeWidth={2.5} /> Correct
                  </>
                ) : (
                  <>
                    <X className="h-5 w-5 text-incorrect" aria-hidden strokeWidth={2.5} /> Not quite
                  </>
                )}
              </p>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-paper-ink-soft">{q.explanation}</p>
            </div>
          )}
        </motion.section>
      </AnimatePresence>
      <div className="mt-5 flex min-h-12 items-center justify-end">
        {chosen && (
          <Button size="lg" onClick={() => setIndex((i) => i + 1)}>
            {index + 1 < questions.length ? "Next question" : "See score"} <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>
    </div>
  );
}

function PracticeTool({ subjects, topicId, setTopicId }: { subjects: Subject[]; topicId: string; setTopicId: (v: string) => void }) {
  const [state, action] = useActionState<PracticeState, FormData>(generatePractice, {});
  const [difficulty, setDifficulty] = useState<"foundation" | "standard" | "challenge">("standard");
  const [count, setCount] = useState<5 | 10>(5);
  return (
    <div className="space-y-8">
      <form action={action} className="space-y-5">
        {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
        <TopicSelect subjects={subjects} value={topicId} onChange={setTopicId} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Segmented
            name="difficulty"
            legend="Difficulty"
            choices={[
              { value: "foundation", label: "Foundation" },
              { value: "standard", label: "Standard" },
              { value: "challenge", label: "Challenge" },
            ]}
            value={difficulty}
            onChange={setDifficulty}
          />
          <Segmented
            name="count"
            legend="Questions"
            choices={[
              { value: 5, label: "5" },
              { value: 10, label: "10" },
            ]}
            value={count}
            onChange={setCount}
          />
        </div>
        <SubmitButton pendingLabel="Writing questions…">
          Make practice questions <ArrowRight className="h-4 w-4" aria-hidden />
        </SubmitButton>
      </form>
      {state.result && (
        <div className="space-y-4">
          <PracticeSet key={state.result.requestId} questions={state.result.questions} topic={state.result.topic} />
          <AiLabel />
        </div>
      )}
    </div>
  );
}

function FlashcardTool({ subjects, topicId, setTopicId }: { subjects: Subject[]; topicId: string; setTopicId: (v: string) => void }) {
  const [state, action] = useActionState<FlashcardState, FormData>(generateFlashcards, {});
  return (
    <form action={action} className="space-y-5">
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      <TopicSelect subjects={subjects} value={topicId} onChange={setTopicId} />
      <p className="text-sm text-ink-soft">
        Makes a deck of 10 cards on the key facts for this topic. It&apos;s saved with your other decks, marked as made by AI, and you
        can edit or delete any card.
      </p>
      <SubmitButton pendingLabel="Making cards…">
        Make a flashcard deck <ArrowRight className="h-4 w-4" aria-hidden />
      </SubmitButton>
    </form>
  );
}

export function AiStudio({ subjects, usage, initialTopicId }: { subjects: Subject[]; usage: Usage | null; initialTopicId: string }) {
  const [tool, setTool] = useState<Tool>("explain");
  const [topicId, setTopicId] = useState(initialTopicId);
  const shared = { subjects, topicId, setTopicId };

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_16rem]">
      <div>
        <div role="tablist" aria-label="AI tools" className="inline-flex flex-wrap gap-1 rounded-lg bg-deep p-1 shadow-[inset_0_0_0_1px_var(--color-line)]">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tool === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTool(t.id)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-md px-3.5 text-sm font-medium transition-colors duration-200",
                tool === t.id ? "bg-slate-raised text-ink shadow-raised" : "text-ink-soft hover:text-ink",
              )}
            >
              <t.icon className="h-4 w-4" aria-hidden />
              {t.label}
            </button>
          ))}
        </div>
        <div role="tabpanel" id={`panel-${tool}`} aria-labelledby={`tab-${tool}`} className="mt-8">
          {tool === "explain" && <ExplainTool {...shared} />}
          {tool === "practice" && <PracticeTool {...shared} />}
          {tool === "flashcards" && <FlashcardTool {...shared} />}
        </div>
      </div>

      <aside className="space-y-6 self-start text-sm">
        {usage && (
          <section aria-labelledby="ai-usage" className="rounded-xl border border-line bg-deep p-5">
            <h2 id="ai-usage" className="font-semibold">
              Today&apos;s allowance
            </h2>
            <dl className="mt-3 space-y-2 text-ink-soft">
              {(
                [
                  ["Explanations", usage.explanation, usage.limits.explanation],
                  ["Practice questions", usage.questions, usage.limits.questions],
                  ["Flashcard decks", usage.flashcards, usage.limits.flashcards],
                ] as const
              ).map(([label, used, limit]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt>{label}</dt>
                  <dd className="tabular text-ink">
                    {Math.max(0, limit - used)} left
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-ink-muted">Allowances refill 24 hours after you use them.</p>
          </section>
        )}
        <p className="text-xs leading-relaxed text-ink-muted">
          Your question is sent to an AI service to write the answer. Don&apos;t include your name or any personal details.
        </p>
      </aside>
    </div>
  );
}
