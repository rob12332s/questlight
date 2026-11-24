import type { Metadata } from "next";
import { ArrowRight, GraduationCap } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SubjectIcon } from "@/components/subject-icon";
import { BOARD_NAMES } from "@/config/boards";
import { subjectStyle } from "@/config/subject-theme";
import { ProBadge, StatusChip } from "@/features/library/labels";
import { ProPanel } from "@/features/pro/pro-panel";
import { getCourses, getLibrary, getPlan, getSubjects, inCourse } from "@/server/library";
import { getCurrentStudent } from "@/server/session";

export const metadata: Metadata = { title: "Exam Answer Coach" };

export default async function LibraryPage() {
  const student = await getCurrentStudent();
  if (!student) redirect("/login?next=/library");
  const [subjects, library, courses, plan] = await Promise.all([getSubjects(), getLibrary(), getCourses(student.userId), getPlan()]);

  const withTopics = subjects
    .map((s) => {
      const topics = library.filter((t) => t.subjectId === s.id);
      const course = courses.get(s.id);
      const mine = topics.filter((t) => inCourse(t, course));
      return {
        ...s,
        course,
        isMine: courses.has(s.id),
        total: mine.length,
        lessons: mine.filter((t) => t.contentStatus === "lesson").length,
        free: mine.filter((t) => t.access === "free").length,
      };
    })
    .filter((s) => s.total > 0)
    .sort((a, b) => Number(b.isMine) - Number(a.isMine));

  const ready = library
    .filter((t) => t.contentStatus === "lesson" && (courses.size === 0 || courses.has(t.subjectId)) && inCourse(t, courses.get(t.subjectId)))
    .slice(0, 12);
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const noBoards = [...courses.values()].some((c) => !c.board);

  return (
    <div className="room-glow">
      <p className="text-sm font-medium text-beam-bright">Exam Answer Coach</p>
      <h1 className="mt-2 max-w-2xl text-3xl font-semibold sm:text-4xl">Understand the topic. Learn how to answer. Practise the method.</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        Pick a topic you find hard. The coach teaches it, walks you through a worked example step by step, gives you hints while you
        practise, then tests you and shows exactly where the marks went.
      </p>

      {(courses.size === 0 || noBoards) && (
        <Link
          href="/settings#courses"
          className="mt-8 flex items-center gap-3 rounded-xl border border-beam/30 bg-beam-wash px-4 py-3 text-sm hover:border-beam"
        >
          <GraduationCap className="h-5 w-5 shrink-0 text-beam-bright" aria-hidden />
          <span className="flex-1">
            {courses.size === 0
              ? "Tell us your subjects, exam boards and tiers so the library shows your course."
              : "Add your exam board and tier for each subject so the library matches your course."}
          </span>
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      )}

      <section aria-labelledby="subjects-heading" className="mt-10">
        <h2 id="subjects-heading" className="text-lg font-semibold">
          Subjects
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {withTopics.map((s) => (
            <li key={s.id} style={subjectStyle(s.slug)}>
              <Link
                href={`/library/${s.slug}`}
                className="subject-ring group flex h-full flex-col rounded-2xl border border-line bg-deep p-5 transition-colors hover:border-line-strong hover:bg-slate/50"
              >
                <span className="flex items-center gap-3">
                  <span className="subject-chip flex h-10 w-10 items-center justify-center rounded-xl">
                    <SubjectIcon slug={s.slug} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{s.name}</span>
                    <span className="block text-xs text-ink-muted">
                      {s.course?.board ? BOARD_NAMES[s.course.board] : s.isMine ? "Board not set" : "Not one of your subjects"}
                      {s.course?.tier ? ` · ${s.course.tier === "higher" ? "Higher" : "Foundation"}` : ""}
                    </span>
                  </span>
                </span>
                <span className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <span>
                    <span className="block text-xl font-semibold tabular-nums">{s.total}</span>
                    <span className="text-xs text-ink-muted">topics</span>
                  </span>
                  <span>
                    <span className="block text-xl font-semibold tabular-nums">{s.lessons}</span>
                    <span className="text-xs text-ink-muted">full lessons</span>
                  </span>
                  <span>
                    <span className="block text-xl font-semibold tabular-nums">{plan.pro ? s.total : s.free}</span>
                    <span className="text-xs text-ink-muted">{plan.pro ? "open" : "free"}</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {ready.length > 0 && (
        <section aria-labelledby="ready-heading" className="mt-12">
          <h2 id="ready-heading" className="text-lg font-semibold">
            Full coach lessons ready now
          </h2>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {ready.map((t) => {
              const s = subjectById.get(t.subjectId)!;
              return (
                <li key={t.id} style={subjectStyle(s.slug)}>
                  <Link
                    href={`/library/${s.slug}/${t.slug}`}
                    className="flex h-full items-center gap-3 rounded-xl border border-line bg-deep px-4 py-3 hover:border-line-strong"
                  >
                    <span className="subject-fill h-8 w-1 shrink-0 rounded-full" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{t.title}</span>
                      <span className="block text-xs text-ink-muted">{s.name}</span>
                    </span>
                    {t.access === "pro" && !plan.pro ? <ProBadge locked /> : <StatusChip status="lesson" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {!plan.pro && <ProPanel className="mt-12" />}

      <p className="mt-10 max-w-2xl text-sm text-ink-muted">
        Topics marked “Verified coverage” have been checked against the published specification. Others are labelled “Awaiting
        verification” until someone has checked them line by line. Questions are written for Questlight and are not taken from exam
        papers.
      </p>
    </div>
  );
}
