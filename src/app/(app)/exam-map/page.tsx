import type { Metadata } from "next";
import { ArrowRight, Compass, TrendingUp } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { subjectStyle } from "@/config/subject-theme";
import {
  accuracyBySkill,
  accuracyByWeek,
  MASTERY_LABELS,
  recommendNext,
  topicMastery,
  type MasteryLevel,
  type TopicMastery,
} from "@/domain/mastery";
import { recurringMistakes } from "@/domain/mistakes";
import { skillLabel } from "@/features/library/labels";
import type { LibraryTopic } from "@/features/library/types";
import { cn } from "@/lib/cn";
import { getCoachAttempts, getCourses, getLibrary, getSubjects, inCourse } from "@/server/library";
import { getCurrentStudent } from "@/server/session";
import { serverNowMs } from "@/server/time";

export const metadata: Metadata = { title: "My Exam Map" };

const LEVELS: MasteryLevel[] = ["mastered", "nearly_mastered", "developing", "learning", "not_started"];
const LEVEL_COLOUR: Record<MasteryLevel, string> = {
  mastered: "bg-correct",
  nearly_mastered: "bg-beam",
  developing: "bg-caution",
  learning: "bg-incorrect/80",
  not_started: "bg-slate-raised",
};

const pct = (n: number | null) => (n === null ? "—" : `${Math.round(n * 100)}%`);

export default async function ExamMapPage() {
  const student = await getCurrentStudent();
  if (!student) redirect("/login?next=/exam-map");
  const [subjects, library, courses, attempts] = await Promise.all([getSubjects(), getLibrary(), getCourses(student.userId), getCoachAttempts(student.userId)]);
  const now = serverNowMs();

  const attemptedIds = new Set(attempts.map((a) => a.topicId));
  const myTopics = library.filter(
    (t) => attemptedIds.has(t.id) || ((courses.size === 0 || courses.has(t.subjectId)) && inCourse(t, courses.get(t.subjectId))),
  );
  const byId = new Map(library.map((t) => [t.id, t]));
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const mastery = new Map<string, TopicMastery>(myTopics.map((t) => [t.id, topicMastery(t.id, attempts, now)]));
  const attempted = [...mastery.values()].filter((m) => m.level !== "not_started");

  const counts = Object.fromEntries(LEVELS.map((l) => [l, 0])) as Record<MasteryLevel, number>;
  for (const m of mastery.values()) counts[m.level] += 1;

  const independent = attempts.filter((a) => a.mode === "independent" || a.mode === "retest");
  const recent = [...independent].reverse().slice(0, 8);
  const weeks = accuracyByWeek(attempts, 8, now);
  const skills = accuracyBySkill(attempts, new Map(library.map((t) => [t.id, t.skill])));
  const recurring = recurringMistakes(independent.slice(-20));

  const sorted = (f: (m: TopicMastery) => boolean, by: (m: TopicMastery) => number) => attempted.filter(f).sort((a, b) => by(a) - by(b));
  const strongest = sorted((m) => m.level === "mastered" || m.level === "nearly_mastered", (m) => -(m.recentAccuracy ?? 0)).slice(0, 5);
  const weakest = sorted((m) => m.recentAccuracy !== null && m.recentAccuracy < 0.6, (m) => m.recentAccuracy ?? 0).slice(0, 5);
  const improving = attempted.filter((m) => m.improving).slice(0, 5);
  const again = attempted.filter((m) => m.needsAnotherAttempt || m.dueRetest).slice(0, 5);

  // Topics with a full lesson first, so "start" suggestions are always something you can do now.
  const candidates = [
    ...myTopics.filter((t) => attemptedIds.has(t.id)),
    ...myTopics.filter((t) => !attemptedIds.has(t.id) && t.contentStatus === "lesson"),
  ].map((t) => ({ id: t.id, title: t.title, subject: t.subjectId, skill: t.skill }));
  const recs = recommendNext(candidates, mastery, recurring);

  const notStartedBySubject = subjects
    .map((s) => ({ s, n: myTopics.filter((t) => t.subjectId === s.id && mastery.get(t.id)?.level === "not_started").length }))
    .filter((x) => x.n > 0);

  const total = mastery.size || 1;

  return (
    <div className="room-glow">
      <p className="text-sm font-medium text-beam-bright">My Exam Map</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Where your marks are — and where they aren&apos;t yet</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Built only from exam-style questions you answer on your own. A topic counts as mastered after strong results on separate days, not
        from one lucky answer. This map doesn&apos;t predict grades.
      </p>

      <section aria-labelledby="mastery-heading" className="mt-10 rounded-2xl border border-line bg-deep p-5 sm:p-7">
        <h2 id="mastery-heading" className="font-semibold">
          Mastery across {mastery.size} topics in your course
        </h2>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate" role="img" aria-label={LEVELS.map((l) => `${MASTERY_LABELS[l]}: ${counts[l]}`).join(", ")}>
          {LEVELS.map((l) => (counts[l] > 0 ? <span key={l} className={LEVEL_COLOUR[l]} style={{ width: `${(counts[l] / total) * 100}%` }} /> : null))}
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {LEVELS.map((l) => (
            <li key={l} className="flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-full", LEVEL_COLOUR[l])} aria-hidden />
              <span className="text-ink-soft">{MASTERY_LABELS[l]}</span>
              <span className="font-semibold tabular-nums">{counts[l]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="next-heading" className="mt-8">
        <h2 id="next-heading" className="flex items-center gap-2 text-lg font-semibold">
          <Compass className="h-5 w-5 text-beam-bright" aria-hidden /> Your next steps
        </h2>
        {recs.length === 0 ? (
          <p className="mt-3 text-ink-soft">
            Start a topic in the <Link href="/library" className="underline">Exam Coach</Link> and your next steps will appear here.
          </p>
        ) : (
          <ol className="mt-4 space-y-2.5">
            {recs.map((r) => {
              const t = byId.get(r.topicId);
              if (!t) return null;
              const s = subjectById.get(t.subjectId);
              const mode = r.mode === "learn" ? "teach" : r.mode === "independent" ? "test" : r.mode === "retest" ? "test&retest=1" : r.mode;
              return (
                <li key={r.topicId} style={subjectStyle(s?.slug ?? "")}>
                  <Link href={`/coach/${t.id}?mode=${mode}`} className="group flex items-center gap-4 rounded-xl border border-line bg-deep px-4 py-3.5 hover:border-line-strong">
                    <span className="subject-fill h-10 w-1 shrink-0 rounded-full" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">
                        {t.title} <span className="font-normal text-ink-muted">· {s?.name}</span>
                      </span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-ink-soft">{r.reason}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <TopicList title="Strongest topics" empty="Score 80%+ on your own to see topics here." items={strongest} topics={byId} />
        <TopicList title="Weakest topics" empty="No weak topics recorded yet." items={weakest} topics={byId} tone="weak" />
        <TopicList title="Improving" empty="Retry a topic to see your improvement." items={improving} topics={byId} icon />
        <TopicList title="Needs another attempt" empty="Nothing waiting for a retry." items={again} topics={byId} tone="weak" />
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <section aria-labelledby="time-heading" className="rounded-2xl border border-line bg-deep p-5">
          <h2 id="time-heading" className="font-semibold">
            Accuracy over the last 8 weeks
          </h2>
          <div className="mt-5 flex h-36 items-end gap-2" role="img" aria-label={weeks.map((w) => pct(w.accuracy)).join(", ")}>
            {weeks.map((w) => (
              <div key={w.weekStart} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[0.7rem] text-ink-muted tabular-nums">{w.accuracy === null ? "" : pct(w.accuracy)}</span>
                <span className="w-full rounded-t-md bg-beam/80" style={{ height: `${Math.max(w.accuracy === null ? 0 : 4, (w.accuracy ?? 0) * 100)}px` }} />
                <span className="text-[0.7rem] text-ink-muted">{new Date(w.weekStart).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="recent-heading" className="rounded-2xl border border-line bg-deep p-5">
          <h2 id="recent-heading" className="font-semibold">
            Recent marks
          </h2>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">Your exam-style results will appear here.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line text-sm">
              {recent.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate">{byId.get(a.topicId)?.title ?? "Topic"}</span>
                  <span className="shrink-0 tabular-nums">
                    {a.marksAwarded}/{a.marksAvailable}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="technique-heading" className="rounded-2xl border border-line bg-deep p-5">
          <h2 id="technique-heading" className="font-semibold">
            Exam technique
          </h2>
          {skills.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">Once you&apos;ve answered a few exam-style questions, your accuracy for each skill shows here.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {skills.map((s) => (
                <li key={s.skill}>
                  <div className="flex justify-between text-sm">
                    <span>{skillLabel(s.skill)}</span>
                    <span className="tabular-nums text-ink-soft">{pct(s.accuracy)}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate">
                    <div className="h-full rounded-full bg-beam" style={{ width: `${s.accuracy * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="mistakes-heading" className="rounded-2xl border border-line bg-deep p-5">
          <h2 id="mistakes-heading" className="font-semibold">
            Recurring mistakes
          </h2>
          {recurring.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">No pattern yet. When the same slip shows up twice, it appears here with a fix.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {recurring.slice(0, 4).map((m) => (
                <li key={m.tag}>
                  <p className="text-sm font-semibold">
                    {m.label} <span className="font-normal text-ink-muted">· {m.count} times</span>
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">{m.fix}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {notStartedBySubject.length > 0 && (
        <section aria-labelledby="unstarted-heading" className="mt-10">
          <h2 id="unstarted-heading" className="text-lg font-semibold">
            Not attempted yet
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {notStartedBySubject.map(({ s, n }) => (
              <li key={s.id} style={subjectStyle(s.slug)}>
                <Link href={`/library/${s.slug}`} className="subject-chip inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm">
                  {s.name} <span className="tabular-nums opacity-80">{n}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-12 text-sm text-ink-muted">
        Marks are indicative: auto-marked answers plus mark-scheme points you checked yourself. They are not exam-board marks.{" "}
        <Link href="/library" className={cn(buttonClasses("ghost", "sm"), "ml-1")}>
          Open the Exam Coach
        </Link>
      </p>
    </div>
  );
}

function TopicList({
  title,
  empty,
  items,
  topics,
  tone,
  icon,
}: {
  title: string;
  empty: string;
  items: TopicMastery[];
  topics: Map<string, LibraryTopic>;
  tone?: "weak";
  icon?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-line bg-deep p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        {icon && <TrendingUp className="h-4 w-4 text-correct" aria-hidden />}
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {items.map((m) => {
            const t = topics.get(m.topicId);
            if (!t) return null;
            return (
              <li key={m.topicId}>
                <Link href={`/coach/${t.id}?mode=${tone === "weak" ? "guided" : "test"}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-beam-bright">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{t.title}</span>
                    <span className="block text-xs text-ink-muted">{MASTERY_LABELS[m.level]}</span>
                  </span>
                  <span className={cn("shrink-0 tabular-nums", tone === "weak" ? "text-incorrect" : "text-ink-soft")}>{pct(m.recentAccuracy)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
