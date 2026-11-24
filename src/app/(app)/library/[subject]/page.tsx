import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SubjectIcon } from "@/components/subject-icon";
import { subjectStyle } from "@/config/subject-theme";
import { LearningContext, ProBadge, StatusChip, tierLabel } from "@/features/library/labels";
import type { LibraryTopic } from "@/features/library/types";
import { ProSubjectBanner } from "@/features/pro/pro-panel";
import { UpgradeButton } from "@/features/pro/upgrade";
import { cn } from "@/lib/cn";
import { getCourses, getLibrary, getPlan, getSubjects, inCourse } from "@/server/library";
import { getCurrentStudent } from "@/server/session";

export async function generateMetadata({ params }: { params: Promise<{ subject: string }> }): Promise<Metadata> {
  const { subject } = await params;
  const s = (await getSubjects()).find((x) => x.slug === subject);
  return { title: s ? `${s.name} library` : "Library" };
}

export default async function SubjectLibraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ subject: string }>;
  searchParams: Promise<{ view?: string; only?: string }>;
}) {
  const [{ subject: slug }, { view, only }] = await Promise.all([params, searchParams]);
  const student = await getCurrentStudent();
  if (!student) redirect(`/login?next=/library/${slug}`);
  const [subjects, library, courses, plan] = await Promise.all([getSubjects(), getLibrary(), getCourses(student.userId), getPlan()]);
  const subject = subjects.find((s) => s.slug === slug);
  if (!subject) notFound();

  const course = courses.get(subject.id);
  const showAll = view === "all";
  const all = library.filter((t) => t.subjectId === subject.id);
  const inMine = all.filter((t) => inCourse(t, course));
  let topics = showAll ? all : inMine;
  if (only === "lessons") topics = topics.filter((t) => t.contentStatus === "lesson");
  const locked = plan.pro ? 0 : topics.filter((t) => t.access === "pro").length;
  const lessons = topics.filter((t) => t.contentStatus === "lesson").length;

  // Group by area, then subtopic, keeping catalogue order.
  const areas: { area: string; groups: { subtopic: string; topics: LibraryTopic[] }[] }[] = [];
  for (const t of topics) {
    let a = areas.find((x) => x.area === t.area);
    if (!a) areas.push((a = { area: t.area, groups: [] }));
    const key = t.subtopic ?? t.area;
    let g = a.groups.find((x) => x.subtopic === key);
    if (!g) a.groups.push((g = { subtopic: key, topics: [] }));
    g.topics.push(t);
  }

  const base = `/library/${subject.slug}`;
  const link = (v: string | undefined, o: string | undefined) => {
    const p = new URLSearchParams();
    if (v) p.set("view", v);
    if (o) p.set("only", o);
    const q = p.toString();
    return q ? `${base}?${q}` : base;
  };
  const hiddenByCourse = all.length - inMine.length;

  return (
    <div style={subjectStyle(subject.slug)}>
      <Link href="/library" className="text-sm text-ink-soft hover:text-ink">
        ← All subjects
      </Link>
      <div className="mt-4 flex items-center gap-4">
        <span className="subject-chip flex h-12 w-12 items-center justify-center rounded-2xl">
          <SubjectIcon slug={subject.slug} className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold">{subject.name}</h1>
          <LearningContext subject="GCSE" board={course?.board ?? null} tier={course?.tier ?? null} />
        </div>
      </div>

      <p className="mt-5 text-ink-soft">
        {topics.length} topics · {lessons} with a full coach lesson
        {!showAll && hiddenByCourse > 0 && (
          <>
            {" "}
            · {hiddenByCourse} hidden because they aren&apos;t in your course (<Link href={link("all", only)} className="underline hover:text-ink">show them</Link>)
          </>
        )}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {[
          { label: "My course", href: link(undefined, only), active: !showAll },
          { label: "Everything", href: link("all", only), active: showAll },
        ].map((f) => (
          <Link key={f.label} href={f.href} aria-current={f.active ? "true" : undefined} className={cn("rounded-full px-3.5 py-1.5", f.active ? "bg-ink text-night" : "bg-slate text-ink-soft hover:text-ink")}>
            {f.label}
          </Link>
        ))}
        <span className="mx-1 w-px self-stretch bg-line" aria-hidden />
        <Link
          href={link(showAll ? "all" : undefined, only === "lessons" ? undefined : "lessons")}
          aria-current={only === "lessons" ? "true" : undefined}
          className={cn("rounded-full px-3.5 py-1.5", only === "lessons" ? "bg-beam text-night" : "bg-slate text-ink-soft hover:text-ink")}
        >
          Full lessons only
        </Link>
        <Link href="/settings#courses" className="ml-auto self-center text-ink-soft underline-offset-4 hover:text-ink hover:underline">
          Change board, tier or texts
        </Link>
      </div>

      {!plan.pro && (
        <div className="mt-6">
          <ProSubjectBanner subject={subject.name} lockedCount={locked} />
        </div>
      )}

      {areas.length === 0 && <p className="mt-10 text-ink-soft">No topics match. Try “Everything”.</p>}

      <div className="mt-10 space-y-12">
        {areas.map((a) => (
          <section key={a.area} aria-labelledby={`area-${a.area}`}>
            <h2 id={`area-${a.area}`} className="text-xl font-semibold">
              {a.area}
            </h2>
            <div className="mt-4 space-y-6">
              {a.groups.map((g) => (
                <div key={g.subtopic}>
                  {g.subtopic !== a.area && <h3 className="mb-2 text-sm font-medium text-ink-soft">{g.subtopic}</h3>}
                  <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-deep">
                    {g.topics.map((t) => (
                      <li key={t.id}>
                        <TopicRow topic={t} href={`${base}/${t.slug}`} locked={t.access === "pro" && !plan.pro} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function TopicRow({ topic: t, href, locked }: { topic: LibraryTopic; href: string; locked: boolean }) {
  const tier = tierLabel(t.tier);
  const inner = (
    <>
      <span className="min-w-0 flex-1">
        <span className={cn("block font-medium", locked && "text-ink-soft")}>{t.title}</span>
        <span className="mt-0.5 block text-sm text-ink-muted">{t.objective}</span>
        <span className="mt-2 flex flex-wrap gap-1.5">
          <StatusChip status={t.contentStatus} />
          {tier && <span className="inline-flex h-6 items-center rounded-sm bg-slate px-2 text-xs text-ink-soft">{tier}</span>}
          {t.qualification === "separate_only" && <span className="inline-flex h-6 items-center rounded-sm bg-slate px-2 text-xs text-ink-soft">Separate science</span>}
        </span>
      </span>
      {locked ? <ProBadge locked /> : <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />}
    </>
  );
  const cls = "flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-slate/50";
  return locked ? (
    <UpgradeButton reason={`“${t.title}” is part of Pro.`} className={cls}>
      {inner}
    </UpgradeButton>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}
