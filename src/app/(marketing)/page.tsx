import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { ButtonLink } from "@/components/ui/button";
import { SubjectIcon } from "@/components/subject-icon";
import { LAUNCH_SUBJECTS } from "@/config/subjects";
import { ExplanationLevels } from "@/features/landing/explanation-levels";
import { LobbyPreview } from "@/features/landing/lobby-preview";
import { TryAQuestion } from "@/features/landing/try-a-question";

const LOOP = [
  {
    title: "Practise",
    body: "Short quizzes and flashcards by subject and topic, at the level you choose.",
  },
  {
    title: "See the gaps",
    body: "Every answer counts towards your accuracy per topic, so weak spots show up on their own.",
  },
  {
    title: "Target them",
    body: "Get a clearer explanation and fresh questions on exactly the topics you keep missing.",
  },
  {
    title: "Prove it",
    body: "Take it into a live game with friends or your class, and watch the topic turn green.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero: the product itself, answerable straight away */}
      <section className="container-page grid items-start gap-12 pt-14 pb-20 sm:pt-20 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:pt-24 lg:pb-28">
        {/* Top-aligned so the headline stays put when the card below grows */}
        <div className="lg:pt-10">
          <h1 className="animate-enter text-[2.5rem] font-semibold sm:text-5xl lg:text-display">
            Revision that knows what you got wrong.
          </h1>
          <p className="mt-6 max-w-[34rem] animate-enter text-lg text-ink-soft [animation-delay:90ms]">
            Questlight connects your quizzes, flashcards and live games with friends, so every answer helps decide what
            you should study next. Built for GCSE students.
          </p>
          <div className="mt-8 flex animate-enter flex-wrap gap-3 [animation-delay:170ms]">
            <ButtonLink href="/signup" size="lg">
              Create a free account
            </ButtonLink>
            <ButtonLink href="#how-it-works" size="lg" variant="secondary">
              See how it works
            </ButtonLink>
          </div>
          <p className="mt-5 animate-enter text-sm text-ink-muted [animation-delay:240ms]">
            Free, no real name needed, no adverts. Questlight is in early access and features are switching on one at a
            time.{" "}
            <Link href="/features" className="text-ink-soft underline decoration-line-strong underline-offset-4 hover:text-ink">
              See what&apos;s live
            </Link>
          </p>
        </div>

        <div className="animate-enter [animation-delay:140ms]">
          <TryAQuestion />
        </div>
      </section>

      {/* The connected loop — a genuine sequence, so it is numbered */}
      <section id="how-it-works" className="scroll-mt-20 border-t border-line bg-deep">
        <div className="container-page py-20 lg:py-24">
          <Reveal className="max-w-2xl">
            <h2 className="text-3xl font-semibold sm:text-4xl">One loop, not four separate apps.</h2>
            <p className="mt-4 text-lg text-ink-soft">
              Most revision tools stop when the quiz ends. Here, what you get wrong shapes what comes next.
            </p>
          </Reveal>

          <ol className="mt-12 grid gap-px overflow-hidden rounded-xl bg-line sm:grid-cols-2 lg:grid-cols-4">
            {LOOP.map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 90} className="flex flex-col bg-deep p-6">
                <span
                  className="tabular flex h-8 w-8 items-center justify-center rounded-full border border-line-strong text-sm font-medium text-beam-bright"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-ink-soft">{step.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Two pillars, each shown rather than described */}
      <section className="container-page grid gap-16 py-20 lg:grid-cols-2 lg:gap-12 lg:py-28">
        <Reveal>
          <h2 className="text-2xl font-semibold sm:text-3xl">Explanations that meet you where you are.</h2>
          <p className="mt-3 max-w-lg text-ink-soft">
            Stuck on an idea? Ask for it simpler, at GCSE level, or with more depth. Explanations match the stage you
            chose when you signed up.
          </p>
          <div className="mt-8">
            <ExplanationLevels />
          </div>
        </Reveal>
        <Reveal delay={120}>
          <h2 className="text-2xl font-semibold sm:text-3xl">Live games with a six-character code.</h2>
          <p className="mt-3 max-w-lg text-ink-soft">
            Start a private room, share the code, and play the same questions at the same time. Scores are worked out on
            the server, so nobody can fiddle them.
          </p>
          <div className="mt-8">
            <LobbyPreview />
          </div>
        </Reveal>
      </section>

      {/* What exists at launch, stated plainly */}
      <section className="border-t border-line">
        <div className="container-page grid gap-10 py-20 lg:grid-cols-[1fr_1.4fr] lg:gap-16 lg:py-24">
          <Reveal>
            <h2 className="text-2xl font-semibold sm:text-3xl">Starting with GCSE.</h2>
            <p className="mt-3 text-ink-soft">
              Nine subjects at launch, with topics added steadily. Questions are written for Questlight. Exam-board
              labels only appear once content has been checked against that specification.
            </p>
          </Reveal>
          <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-line sm:grid-cols-3">
            {LAUNCH_SUBJECTS.map((subject, i) => (
              <Reveal as="li" key={subject.slug} delay={i * 40} className="flex items-center gap-3 bg-night px-4 py-4">
                <SubjectIcon slug={subject.slug} className="h-5 w-5 text-ink-muted" />
                <span className="text-[0.9375rem]">{subject.name}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-line bg-deep">
        <div className="container-page flex flex-col items-start justify-between gap-6 py-16 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold">Find your weakest topic this week.</h2>
            <p className="mt-2 text-ink-soft">It takes a minute to set up, and you only need a display name.</p>
          </div>
          <ButtonLink href="/signup" size="lg">
            Create a free account
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
