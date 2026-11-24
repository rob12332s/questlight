"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, ChevronRight, Lightbulb, RotateCcw, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Button, buttonClasses } from "@/components/ui/button";
import { markAnswer, type Answer, type GuidedQuestion, type MarkPoint } from "@/domain/lesson";
import { MISTAKE_TAGS, isMistakeTag } from "@/domain/mistakes";
import { cn } from "@/lib/cn";
import { checkExamAnswer, finishTest, getAiFeedback, recordPractice, type AiFeedback, type QuestionResult, type TestOutcome } from "./actions";
import { COACH_MODES, type CoachModeId, type LessonView, type PublicAnswer } from "./lesson-view";

export interface CoachProps {
  topicId: string;
  basePath: string;
  mode: CoachModeId;
  lesson: LessonView;
  aiEnabled: boolean;
  /** This student's recent results on this topic, newest first. */
  history: { mode: string; awarded: number; available: number; mistakes: string[]; at: string }[];
  /** "retest" when the Exam Map sent the student back to check a topic. */
  testMode: "independent" | "retest";
}

const STYLE_INTRO: Record<LessonView["style"], string> = {
  calculation: "You'll choose each step of the calculation yourself.",
  analysis: "You'll build an analytical answer one move at a time.",
  explanation: "You'll build a scientific explanation link by link.",
  evaluation: "You'll build an argument and reach a judgement.",
};

export function Coach(props: CoachProps) {
  const { mode, basePath } = props;
  return (
    <div>
      <nav aria-label="Coach modes" className="-mx-1 flex gap-1.5 overflow-x-auto pb-2">
        {COACH_MODES.map((m) => (
          <Link
            key={m.id}
            href={`${basePath}?mode=${m.id}`}
            scroll={false}
            aria-current={m.id === mode ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors",
              m.id === mode ? "bg-beam text-night" : "bg-slate text-ink-soft hover:text-ink",
            )}
          >
            {m.title}
          </Link>
        ))}
      </nav>
      <div className="mt-8">
        {mode === "teach" && <TeachJourney {...props} />}
        {mode === "answer" && <HowToAnswer lesson={props.lesson} basePath={basePath} />}
        {mode === "worked" && <WorkedExample {...props} onDone={undefined} />}
        {mode === "guided" && <GuidedPractice {...props} />}
        {mode === "test" && <IndependentTest {...props} />}
        {mode === "technique" && <Technique lesson={props.lesson} history={props.history} basePath={basePath} />}
        {mode === "marks" && <WhyLostMarks history={props.history} basePath={basePath} />}
      </div>
    </div>
  );
}

/* ── Building blocks ─────────────────────────────────────────────────────── */

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-line bg-deep p-5 sm:p-7", className)}>{children}</section>;
}

function SectionTitle({ children, kicker }: { children: React.ReactNode; kicker?: string }) {
  return (
    <div className="mb-4">
      {kicker && <p className="text-sm text-beam-bright">{kicker}</p>}
      <h2 className="text-xl font-semibold">{children}</h2>
    </div>
  );
}

function Prose({ text }: { text: string }) {
  return (
    <div className="space-y-3 leading-relaxed whitespace-pre-line text-ink">
      {text.split("\n\n").map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

/* ── Teach me from the beginning ─────────────────────────────────────────── */

function TeachJourney(props: CoachProps) {
  const stages = ["Understand", "Method", "Worked example", "Practise", "Test yourself"] as const;
  const [stage, setStage] = useState(0);
  const next = () => {
    setStage((s) => Math.min(stages.length - 1, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const { lesson } = props;

  return (
    <div>
      <ol className="mb-6 flex flex-wrap gap-2 text-sm" aria-label="Lesson progress">
        {stages.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => setStage(i)}
              aria-current={i === stage ? "step" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1",
                i === stage ? "bg-beam-wash text-ink" : i < stage ? "text-ink-soft" : "text-ink-muted",
              )}
            >
              <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[0.7rem]", i < stage ? "bg-correct/20 text-correct" : "bg-slate")}>
                {i < stage ? <Check className="h-3 w-3" aria-hidden /> : i + 1}
              </span>
              {s}
            </button>
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div key={stage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {stage === 0 && (
            <div className="space-y-5">
              <Panel>
                <SectionTitle kicker="What this topic means">In a nutshell</SectionTitle>
                <p className="text-lg leading-relaxed">{lesson.summary}</p>
              </Panel>
              <KnowledgeChecklist items={lesson.knowledge} />
              {lesson.vocabulary.length > 0 && <Vocabulary items={lesson.vocabulary} />}
              <Button onClick={next} size="lg">
                Next: the method <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          )}
          {stage === 1 && (
            <div className="space-y-5">
              <HowToAnswer lesson={lesson} basePath={props.basePath} embedded />
              <Button onClick={next} size="lg">
                Next: worked example <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          )}
          {stage === 2 && <WorkedExample {...props} onDone={next} />}
          {stage === 3 && <GuidedPractice {...props} onDone={next} />}
          {stage === 4 && <IndependentTest {...props} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function KnowledgeChecklist({ items }: { items: string[] }) {
  const [known, setKnown] = useState<boolean[]>(() => items.map(() => false));
  const count = known.filter(Boolean).length;
  return (
    <Panel>
      <SectionTitle kicker={`${count} of ${items.length} ticked`}>What you need to know</SectionTitle>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-slate/50">
              <input
                type="checkbox"
                checked={known[i]}
                onChange={() => setKnown((k) => k.map((v, j) => (j === i ? !v : v)))}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-beam)]"
              />
              <span className={cn("leading-relaxed", known[i] && "text-ink-soft")}>{item}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-ink-muted">Tick each point once you could explain it to someone else.</p>
    </Panel>
  );
}

function Vocabulary({ items }: { items: { term: string; meaning: string }[] }) {
  return (
    <Panel>
      <SectionTitle>Key vocabulary</SectionTitle>
      <dl className="grid gap-3 sm:grid-cols-2">
        {items.map((v) => (
          <div key={v.term} className="rounded-lg bg-slate/60 p-3.5">
            <dt className="font-semibold">{v.term}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-ink-soft">{v.meaning}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

/* ── Show me how to answer ───────────────────────────────────────────────── */

function HowToAnswer({ lesson, basePath, embedded = false }: { lesson: LessonView; basePath: string; embedded?: boolean }) {
  return (
    <div className="space-y-5">
      <Panel>
        <SectionTitle kicker="Spot it">How to recognise this question</SectionTitle>
        <p className="leading-relaxed">{lesson.recognise}</p>
        {lesson.commandWords.length > 0 && (
          <dl className="mt-5 space-y-2.5">
            {lesson.commandWords.map((c) => (
              <div key={c.word} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <dt className="shrink-0 font-semibold text-beam-bright sm:w-44">{c.word}</dt>
                <dd className="text-ink-soft">{c.meaning}</dd>
              </div>
            ))}
          </dl>
        )}
      </Panel>
      <Panel>
        <SectionTitle kicker="Method">How to answer it</SectionTitle>
        <ol className="space-y-4">
          {lesson.method.map((m, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-beam-wash text-sm font-semibold text-beam-bright">{i + 1}</span>
              <div>
                <p className="font-semibold">{m.title}</p>
                <p className="mt-0.5 leading-relaxed text-ink-soft">{m.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>
      <Panel>
        <SectionTitle kicker="Avoid these">Where marks are lost</SectionTitle>
        <ul className="space-y-3">
          {lesson.mistakes.map((m, i) => (
            <li key={i} className="flex gap-3">
              <X className="mt-1 h-4 w-4 shrink-0 text-incorrect" aria-hidden />
              <span className="leading-relaxed">{m.text}</span>
            </li>
          ))}
        </ul>
      </Panel>
      {!embedded && (
        <Link href={`${basePath}?mode=worked`} className={buttonClasses("primary", "lg")}>
          Try it on a worked example <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

/* ── Walk me through a worked example ────────────────────────────────────── */

function WorkedExample({ topicId, lesson, basePath, onDone }: CoachProps & { onDone?: () => void }) {
  const { worked } = lesson;
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [firstTry, setFirstTry] = useState<boolean[]>([]);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const current = worked.steps[step];
  const choice = picked === null ? null : current?.choices[picked];
  const revealed = worked.steps.slice(0, choice?.correct ? step + 1 : step).map((s) => s.reveal);

  function pick(i: number) {
    if (choice?.correct || !current) return;
    const c = current.choices[i];
    if (!c) return;
    setPicked(i);
    if (firstTry.length === step) setFirstTry((f) => [...f, c.correct]);
    if (!c.correct && c.tag) setMistakes((m) => [...m, c.tag!]);
  }

  function advance() {
    if (step + 1 < worked.steps.length) {
      setStep(step + 1);
      setPicked(null);
    } else {
      setFinished(true);
      const correct = firstTry.filter(Boolean).length;
      void recordPractice(topicId, "worked", correct, worked.steps.length, mistakes);
    }
  }

  return (
    <div className="space-y-5">
      <Panel>
        <SectionTitle kicker={`Worked example · ${worked.marks} mark${worked.marks === 1 ? "" : "s"}`}>Question</SectionTitle>
        <Prose text={worked.question} />
        <p className="mt-4 text-sm text-ink-muted">{STYLE_INTRO[lesson.style]}</p>
      </Panel>

      {revealed.length > 0 && (
        <Panel className="bg-slate/40">
          <h3 className="text-sm font-semibold text-ink-soft">Working so far</h3>
          <ol className="mt-3 space-y-2">
            {revealed.map((r, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
                <span className="text-sm text-ink-muted tabular-nums">{i + 1}.</span>
                <span className="font-medium">{r}</span>
              </motion.li>
            ))}
          </ol>
        </Panel>
      )}

      {!finished && current && (
        <Panel>
          <SectionTitle kicker={`Step ${step + 1} of ${worked.steps.length}`}>{current.prompt}</SectionTitle>
          <div className="grid gap-2.5" role="group" aria-label="Choose the next step">
            {current.choices.map((c, i) => {
              const isPicked = picked === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(i)}
                  disabled={choice?.correct === true}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left leading-relaxed transition-colors",
                    isPicked && c.correct && "border-correct bg-correct/10",
                    isPicked && !c.correct && "border-incorrect bg-incorrect/10",
                    !isPicked && "border-line-strong hover:border-beam hover:bg-slate/50",
                  )}
                >
                  {c.text}
                </button>
              );
            })}
          </div>
          <AnimatePresence>
            {choice && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("mt-4 rounded-lg p-4", choice.correct ? "bg-correct/10" : "bg-incorrect/10")}
                role="status"
              >
                <p className="font-semibold">{choice.correct ? "That's right." : "Not quite."}</p>
                <p className="mt-1 leading-relaxed">{choice.feedback}</p>
                {!choice.correct && <p className="mt-1 text-sm text-ink-soft">Try another option.</p>}
              </motion.div>
            )}
          </AnimatePresence>
          {choice?.correct && (
            <Button className="mt-4" onClick={advance}>
              {step + 1 < worked.steps.length ? "Next step" : "See the full answer"} <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </Panel>
      )}

      {finished && (
        <Panel className="border-correct/40">
          <SectionTitle kicker={`${firstTry.filter(Boolean).length} of ${worked.steps.length} steps right first time`}>The complete answer</SectionTitle>
          <Prose text={worked.finalAnswer} />
          <div className="mt-6 flex flex-wrap gap-3">
            {onDone ? (
              <Button onClick={onDone}>
                Now try one yourself <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            ) : (
              <Link href={`${basePath}?mode=guided`} className={buttonClasses("primary", "md")}>
                Now try a similar question <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                setStep(0);
                setPicked(null);
                setFirstTry([]);
                setMistakes([]);
                setFinished(false);
              }}
            >
              <RotateCcw className="h-4 w-4" aria-hidden /> Go through it again
            </Button>
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ── Answer inputs ───────────────────────────────────────────────────────── */

function AnswerInput({
  answer,
  value,
  onChange,
  disabled,
  id,
}: {
  answer: Answer | PublicAnswer;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  id: string;
}) {
  if (answer.type === "choice") {
    return (
      <div className="grid gap-2" role="radiogroup" aria-labelledby={`${id}-label`}>
        {answer.options.map((o, i) => (
          <label
            key={i}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3",
              value === String(i) ? "border-beam bg-beam-wash" : "border-line-strong hover:bg-slate/50",
              disabled && "cursor-default",
            )}
          >
            <input type="radio" name={id} value={i} checked={value === String(i)} onChange={() => onChange(String(i))} disabled={disabled} className="accent-[var(--color-beam)]" />
            {o}
          </label>
        ))}
      </div>
    );
  }
  if (answer.type === "extended") {
    return (
      <textarea
        id={id}
        aria-labelledby={`${id}-label`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={8}
        maxLength={4000}
        placeholder="Write your answer…"
        className="w-full rounded-xl border border-line-strong bg-night p-4 leading-relaxed outline-none focus:border-beam"
      />
    );
  }
  const unit = answer.type === "numeric" ? answer.unit : undefined;
  return (
    <div className="flex items-center gap-2">
      {unit === "£" && <span className="text-lg text-ink-soft">£</span>}
      <input
        id={id}
        aria-labelledby={`${id}-label`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        inputMode={answer.type === "numeric" ? "decimal" : "text"}
        autoComplete="off"
        maxLength={200}
        className="h-12 w-full max-w-xs rounded-xl border border-line-strong bg-night px-4 text-lg outline-none focus:border-beam"
      />
      {unit && unit !== "£" && <span className="text-ink-soft">{unit}</span>}
    </div>
  );
}

/* ── Practise with hints ─────────────────────────────────────────────────── */

function GuidedPractice({ topicId, lesson, basePath, onDone }: CoachProps & { onDone?: () => void }) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<{ correct: boolean; hints: number }[]>([]);
  const question = lesson.guided[index];
  const done = index >= lesson.guided.length || !question;

  function finishQuestion(correct: boolean, hints: number) {
    const next = [...results, { correct, hints }];
    setResults(next);
    setIndex(index + 1);
    if (next.length === lesson.guided.length) {
      const got = lesson.guided.reduce((s, q, i) => s + (next[i]?.correct ? q.marks : 0), 0);
      const of = lesson.guided.reduce((s, q) => s + q.marks, 0);
      void recordPractice(topicId, "guided", got, of, []);
    }
  }

  if (done) {
    const correct = results.filter((r) => r.correct).length;
    return (
      <Panel>
        <SectionTitle kicker="Guided practice complete">
          {correct} of {lesson.guided.length} correct
        </SectionTitle>
        <p className="text-ink-soft">
          Guided practice helps you learn the method. It doesn&apos;t count towards mastery on your Exam Map — test yourself without hints
          for that.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {onDone ? (
            <Button onClick={onDone}>
              Test yourself <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          ) : (
            <Link href={`${basePath}?mode=test`} className={buttonClasses("primary", "md")}>
              Test yourself <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
          <Button variant="ghost" onClick={() => { setIndex(0); setResults([]); }}>
            <RotateCcw className="h-4 w-4" aria-hidden /> Practise again
          </Button>
        </div>
      </Panel>
    );
  }

  return (
    <GuidedQuestionCard
      key={index}
      q={question}
      number={index + 1}
      total={lesson.guided.length}
      onFinish={finishQuestion}
    />
  );
}

function GuidedQuestionCard({ q, number, total, onFinish }: { q: GuidedQuestion; number: number; total: number; onFinish: (correct: boolean, hints: number) => void }) {
  const [value, setValue] = useState("");
  const [hints, setHints] = useState(0);
  const [state, setState] = useState<"answering" | "wrong" | "right" | "shown">("answering");
  const id = `guided-${number}`;

  function check() {
    const r = markAnswer(q.answer, value);
    setState(r.status === "correct" ? "right" : "wrong");
  }

  return (
    <Panel>
      <SectionTitle kicker={`Guided question ${number} of ${total} · ${q.marks} mark${q.marks === 1 ? "" : "s"}`}>
        <span id={`${id}-label`}>{q.question}</span>
      </SectionTitle>
      <AnswerInput answer={q.answer} value={value} onChange={(v) => { setValue(v); if (state === "wrong") setState("answering"); }} disabled={state === "right" || state === "shown"} id={id} />

      {hints > 0 && (
        <ol className="mt-4 space-y-2">
          {q.hints.slice(0, hints).map((h, i) => (
            <motion.li key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5 rounded-lg bg-caution/10 p-3 text-sm leading-relaxed">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-caution" aria-hidden />
              <span>
                <span className="font-semibold">Hint {i + 1}:</span> {h}
              </span>
            </motion.li>
          ))}
        </ol>
      )}

      <div role="status" className="mt-4">
        {state === "wrong" && <p className="rounded-lg bg-incorrect/10 p-3">Not yet. {hints < q.hints.length ? "Take a hint, or try again." : "Have another go, or see the solution."}</p>}
        {(state === "right" || state === "shown") && (
          <div className={cn("rounded-lg p-4", state === "right" ? "bg-correct/10" : "bg-slate")}>
            <p className="font-semibold">{state === "right" ? "Correct!" : "Solution"}</p>
            <p className="mt-1 leading-relaxed">{q.solution}</p>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {state === "right" || state === "shown" ? (
          <Button onClick={() => onFinish(state === "right", hints)}>
            {number < total ? "Next question" : "Finish"} <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <>
            <Button onClick={check} disabled={value.trim() === ""}>
              Check
            </Button>
            {hints < q.hints.length && (
              <Button variant="secondary" onClick={() => setHints(hints + 1)}>
                <Lightbulb className="h-4 w-4" aria-hidden /> {hints === 0 ? "Give me a hint" : "Another hint"}
              </Button>
            )}
            {(state === "wrong" || hints >= q.hints.length) && (
              <Button variant="ghost" onClick={() => setState("shown")}>
                Show solution
              </Button>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}

/* ── Test me independently ───────────────────────────────────────────────── */

function IndependentTest({ topicId, lesson, aiEnabled, basePath, testMode }: CoachProps) {
  const exam = lesson.exam;
  const [values, setValues] = useState<string[]>(() => exam.map(() => ""));
  const [checked, setChecked] = useState<(QuestionResult | null)[]>(() => exam.map(() => null));
  const [ticks, setTicks] = useState<boolean[][]>(() => exam.map(() => []));
  const [outcome, setOutcome] = useState<TestOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const allChecked = checked.every(Boolean);

  function submit(i: number) {
    setError(null);
    start(async () => {
      const r = await checkExamAnswer(topicId, i, values[i] ?? "");
      if ("error" in r) return setError(r.error);
      setChecked((c) => c.map((x, j) => (j === i ? r : x)));
      setTicks((t) => t.map((x, j) => (j === i ? r.markScheme.map(() => false) : x)));
    });
  }

  function finish() {
    setError(null);
    start(async () => {
      const r = await finishTest(topicId, testMode, exam.map((_, i) => ({ given: values[i] ?? "", ticked: ticks[i] ?? [] })));
      if ("error" in r) return setError(r.error);
      setOutcome(r);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (outcome) return <TestResult outcome={outcome} basePath={basePath} />;

  return (
    <div className="space-y-5">
      <Panel className="bg-slate/40">
        <p className="leading-relaxed">
          <span className="font-semibold">{testMode === "retest" ? "Retest." : "Exam conditions."}</span> No hints. Answer each question, then
          submit it to see the mark scheme. Your result goes on your Exam Map.
        </p>
      </Panel>
      {exam.map((q, i) => {
        const r = checked[i];
        const id = `exam-${i}`;
        const needsTicks = r && (r.status === "self_check" || r.status === "incorrect");
        return (
          <Panel key={i}>
            <p className="text-sm text-beam-bright">
              Question {i + 1} · {q.marks} mark{q.marks === 1 ? "" : "s"}
            </p>
            <div id={`${id}-label`} className="mt-2 mb-4 text-lg">
              <Prose text={q.question} />
            </div>
            <AnswerInput answer={q.answer} value={values[i] ?? ""} onChange={(v) => setValues((vs) => vs.map((x, j) => (j === i ? v : x)))} disabled={Boolean(r)} id={id} />
            {!r && (
              <Button className="mt-4" onClick={() => submit(i)} disabled={pending || (values[i] ?? "").trim() === ""}>
                Submit answer
              </Button>
            )}
            {r && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 space-y-4">
                {r.status !== "self_check" && (
                  <p className={cn("rounded-lg p-3 font-semibold", r.status === "correct" ? "bg-correct/10" : "bg-incorrect/10")} role="status">
                    {r.status === "correct" ? `Correct — ${r.marks}/${r.marks}` : `Not correct. The answer is ${r.correctAnswer}.`}
                  </p>
                )}
                <MarkSchemeCheck
                  scheme={r.markScheme}
                  ticks={ticks[i] ?? []}
                  onToggle={(j) => setTicks((t) => t.map((x, k) => (k === i ? x.map((v, m) => (m === j ? !v : v)) : x)))}
                  mode={needsTicks ? (r.status === "self_check" ? "self" : "method") : "view"}
                />
                <details className="rounded-lg bg-slate/50 p-4">
                  <summary className="cursor-pointer font-medium">Model answer</summary>
                  <div className="mt-3">
                    <Prose text={r.modelAnswer} />
                  </div>
                </details>
                {r.status === "self_check" && aiEnabled && <AiFeedbackBox topicId={topicId} index={i} answer={values[i] ?? ""} />}
              </motion.div>
            )}
          </Panel>
        );
      })}
      {error && (
        <p role="alert" className="rounded-lg bg-incorrect/10 p-3">
          {error}
        </p>
      )}
      <Button size="lg" onClick={finish} disabled={!allChecked || pending}>
        {pending ? "Saving…" : "Finish and see my marks"}
      </Button>
      {!allChecked && <p className="text-sm text-ink-muted">Submit every answer first.</p>}
    </div>
  );
}

function MarkSchemeCheck({ scheme, ticks, onToggle, mode }: { scheme: MarkPoint[]; ticks: boolean[]; onToggle: (i: number) => void; mode: "self" | "method" | "view" }) {
  return (
    <div className="rounded-lg border border-line p-4">
      <p className="font-semibold">Mark scheme</p>
      {mode === "self" && <p className="mt-1 text-sm text-ink-soft">Tick each point your answer clearly makes. Be honest — this is for you.</p>}
      {mode === "method" && <p className="mt-1 text-sm text-ink-soft">Tick any method steps you showed correctly. The final-answer mark can&apos;t be ticked.</p>}
      <ul className="mt-3 space-y-2">
        {scheme.map((m, j) => {
          const disabled = mode === "view" || (mode === "method" && j === scheme.length - 1);
          return (
            <li key={j}>
              <label className={cn("flex items-start gap-3", !disabled && "cursor-pointer")}>
                {mode === "view" ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-correct" aria-hidden />
                ) : (
                  <input type="checkbox" checked={ticks[j] ?? false} onChange={() => onToggle(j)} disabled={disabled} className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-beam)]" />
                )}
                <span className="flex-1 leading-relaxed">{m.point}</span>
                <span className="shrink-0 text-sm text-ink-muted">
                  {m.marks} mark{m.marks === 1 ? "" : "s"}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AiFeedbackBox({ topicId, index, answer }: { topicId: string; index: number; answer: string }) {
  const [feedback, setFeedback] = useState<AiFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="rounded-lg border border-beam/30 bg-beam-wash/50 p-4">
      {!feedback ? (
        <>
          <Button
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                setError(null);
                const r = await getAiFeedback(topicId, index, answer);
                if ("error" in r) setError(r.error);
                else setFeedback(r.feedback);
              })
            }
          >
            <Sparkles className="h-4 w-4" aria-hidden /> {pending ? "Reading your answer…" : "Get AI feedback"}
          </Button>
          <p className="mt-2 text-xs text-ink-muted">Indicative feedback only — not an examiner&apos;s mark. Uses one of your daily AI requests.</p>
          {error && <p role="alert" className="mt-2 text-sm text-incorrect">{error}</p>}
        </>
      ) : (
        <div className="space-y-2 text-sm leading-relaxed">
          <p className="text-xs font-semibold text-beam-bright">AI feedback (indicative, not an official mark)</p>
          <p><span className="font-semibold">What works:</span> {feedback.strengths}</p>
          <p><span className="font-semibold">What&apos;s missing:</span> {feedback.missing}</p>
          <p><span className="font-semibold">Next step:</span> {feedback.nextStep}</p>
        </div>
      )}
    </div>
  );
}

function TestResult({ outcome, basePath }: { outcome: TestOutcome; basePath: string }) {
  const pct = outcome.available ? outcome.awarded / outcome.available : 0;
  const selfChecked = outcome.perQuestion.some((q) => q.selfChecked);
  return (
    <div className="space-y-5">
      <Panel>
        <p className="text-sm text-ink-soft">Your mark</p>
        <p className="mt-1 text-5xl font-semibold tabular-nums">
          {outcome.awarded}
          <span className="text-2xl text-ink-muted">/{outcome.available}</span>
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate">
          <motion.div className="h-full rounded-full bg-beam" initial={{ width: 0 }} animate={{ width: `${Math.round(pct * 100)}%` }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} />
        </div>
        <p className="mt-4 text-sm text-ink-muted">
          Indicative mark against Questlight&apos;s own mark scheme{selfChecked ? ", including points you checked yourself" : ""}. It isn&apos;t an
          official exam-board mark.
        </p>
        {!outcome.recorded && <p className="mt-2 text-sm text-caution">This result couldn&apos;t be saved to your Exam Map.</p>}
      </Panel>
      {outcome.mistakes.length > 0 ? (
        <Panel>
          <SectionTitle kicker="Why you lost marks">What to work on</SectionTitle>
          <ul className="space-y-4">
            {outcome.mistakes.map((m) => (
              <li key={m.tag}>
                <p className="font-semibold">{m.label}</p>
                <p className="mt-0.5 leading-relaxed text-ink-soft">{m.fix}</p>
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <Panel>
          <SectionTitle kicker="Full marks">Nothing to fix here</SectionTitle>
          <p className="text-ink-soft">Come back in a few days for a retest. Mastery on your Exam Map needs strong results on separate days.</p>
        </Panel>
      )}
      <div className="flex flex-wrap gap-3">
        <Link href="/exam-map" className={buttonClasses("primary", "md")}>
          See my Exam Map <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
        {pct < 0.8 && (
          <Link href={`${basePath}?mode=worked`} className={buttonClasses("secondary", "md")}>
            Go through the worked example again
          </Link>
        )}
      </div>
    </div>
  );
}

/* ── Improve my exam technique ───────────────────────────────────────────── */

function Technique({ lesson, history, basePath }: { lesson: LessonView; history: CoachProps["history"]; basePath: string }) {
  const mine = useMemo(() => {
    const counts = new Map<string, number>();
    for (const h of history) for (const t of h.mistakes) if (isMistakeTag(t)) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [history]);

  return (
    <div className="space-y-5">
      {mine.length > 0 && (
        <Panel className="border-caution/40">
          <SectionTitle kicker="From your answers on this topic">Your most common slips</SectionTitle>
          <ul className="space-y-4">
            {mine.map(([tag, n]) => {
              const m = MISTAKE_TAGS[tag as keyof typeof MISTAKE_TAGS];
              return (
                <li key={tag}>
                  <p className="font-semibold">
                    {m.label} <span className="font-normal text-ink-muted">· {n} time{n === 1 ? "" : "s"}</span>
                  </p>
                  <p className="mt-0.5 leading-relaxed text-ink-soft">{m.fix}</p>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
      <Panel>
        <SectionTitle kicker="Technique">How marks are lost on this topic</SectionTitle>
        <ul className="space-y-5">
          {lesson.mistakes.map((m, i) => (
            <li key={i}>
              <p className="leading-relaxed">
                <X className="mr-1.5 inline h-4 w-4 text-incorrect" aria-hidden />
                {m.text}
              </p>
              <p className="mt-1 pl-6 leading-relaxed text-ink-soft">
                <Check className="mr-1.5 inline h-4 w-4 text-correct" aria-hidden />
                {MISTAKE_TAGS[m.tag].fix}
              </p>
            </li>
          ))}
        </ul>
      </Panel>
      {lesson.commandWords.length > 0 && (
        <Panel>
          <SectionTitle>Command words</SectionTitle>
          <dl className="space-y-2.5">
            {lesson.commandWords.map((c) => (
              <div key={c.word} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <dt className="shrink-0 font-semibold text-beam-bright sm:w-44">{c.word}</dt>
                <dd className="text-ink-soft">{c.meaning}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      )}
      <Link href={`${basePath}?mode=test`} className={buttonClasses("primary", "lg")}>
        Put it into practice <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

/* ── Explain why I lost marks ────────────────────────────────────────────── */

function WhyLostMarks({ history, basePath }: { history: CoachProps["history"]; basePath: string }) {
  const tests = history.filter((h) => h.mode === "independent" || h.mode === "retest");
  const last = tests[0];
  if (!last) {
    return (
      <Panel>
        <SectionTitle>No exam-style attempts yet</SectionTitle>
        <p className="text-ink-soft">Test yourself on this topic first. Afterwards, this page explains exactly where your marks went.</p>
        <Link href={`${basePath}?mode=test`} className={cn(buttonClasses("primary", "md"), "mt-5")}>
          Test me now
        </Link>
      </Panel>
    );
  }
  const lostTags = last.mistakes.filter(isMistakeTag);
  return (
    <div className="space-y-5">
      <Panel>
        <SectionTitle kicker={`Your last attempt · ${new Date(last.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}>
          {last.awarded}/{last.available} marks
        </SectionTitle>
        {lostTags.length === 0 ? (
          <p className="text-ink-soft">You didn&apos;t lose marks for any recorded reason. Retest in a few days to confirm it&apos;s secure.</p>
        ) : (
          <ul className="space-y-4">
            {lostTags.map((t) => (
              <li key={t}>
                <p className="font-semibold">{MISTAKE_TAGS[t].label}</p>
                <p className="mt-0.5 leading-relaxed text-ink-soft">{MISTAKE_TAGS[t].fix}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {tests.length > 1 && (
        <Panel>
          <SectionTitle>Earlier attempts</SectionTitle>
          <ul className="divide-y divide-line">
            {tests.slice(1, 8).map((h, i) => (
              <li key={i} className="flex justify-between py-2.5 text-sm">
                <span className="text-ink-soft">{new Date(h.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                <span className="tabular-nums">
                  {h.awarded}/{h.available}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <div className="flex flex-wrap gap-3">
        <Link href={`${basePath}?mode=guided`} className={buttonClasses("primary", "md")}>
          Practise with hints
        </Link>
        <Link href={`${basePath}?mode=test`} className={buttonClasses("secondary", "md")}>
          Try the exam questions again
        </Link>
      </div>
    </div>
  );
}
