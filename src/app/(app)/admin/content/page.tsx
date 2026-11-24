import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TopicAdminForm } from "@/features/admin/admin-forms";
import { cn } from "@/lib/cn";
import { getIsContentAdmin, getLibrary, getSubjects } from "@/server/library";
import { getCurrentStudent } from "@/server/session";

export const metadata: Metadata = { title: "Content admin" };

export default async function ContentAdminPage({ searchParams }: { searchParams: Promise<{ subject?: string; filter?: string }> }) {
  const student = await getCurrentStudent();
  if (!student) redirect("/login?next=/admin/content");
  if (!(await getIsContentAdmin())) notFound();
  const [{ subject: subjectSlug, filter }, subjects, library] = await Promise.all([searchParams, getSubjects(), getLibrary()]);
  const subject = subjects.find((s) => s.slug === subjectSlug) ?? subjects[0];
  let topics = library.filter((t) => t.subjectId === subject?.id);
  if (filter === "unverified") topics = topics.filter((t) => t.verification !== "verified");
  if (filter === "lessons") topics = topics.filter((t) => t.contentStatus === "lesson");
  if (filter === "hidden") topics = topics.filter((t) => !t.isPublished);

  const q = (s: string, f?: string) => `/admin/content?subject=${s}${f ? `&filter=${f}` : ""}`;

  return (
    <div>
      <h1 className="text-3xl font-semibold">Content admin</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Verify topics against the specification, choose what&apos;s free, and edit or publish lessons. Content written by AI or anyone else is
        never published until an admin sets it to Published here.
      </p>
      <nav className="mt-6 flex flex-wrap gap-2 text-sm">
        {subjects.map((s) => (
          <Link key={s.id} href={q(s.slug, filter)} className={cn("rounded-full px-3 py-1.5", s.id === subject?.id ? "bg-ink text-night" : "bg-slate text-ink-soft")}>
            {s.name}
          </Link>
        ))}
      </nav>
      <nav className="mt-3 flex flex-wrap gap-2 text-sm">
        {[
          ["All", undefined],
          ["Awaiting verification", "unverified"],
          ["Full lessons", "lessons"],
          ["Not listed", "hidden"],
        ].map(([label, f]) => (
          <Link key={label} href={q(subject?.slug ?? "", f)} className={cn("rounded-full px-3 py-1.5", filter === f ? "bg-beam text-night" : "bg-slate text-ink-soft")}>
            {label}
          </Link>
        ))}
      </nav>
      <p className="mt-4 text-sm text-ink-muted">{topics.length} topics</p>
      <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-deep">
        {topics.map((t) => (
          <li key={t.id} className="space-y-2 px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span>
                <span className="font-medium">{t.title}</span> <span className="text-xs text-ink-muted">{t.area}</span>
              </span>
              <Link href={`/admin/content/${t.id}`} className="text-sm text-beam-bright hover:underline">
                Edit lesson
              </Link>
            </div>
            <TopicAdminForm topicId={t.id} verification={t.verification} access={t.access} contentStatus={t.contentStatus} published={t.isPublished} />
          </li>
        ))}
      </ul>
    </div>
  );
}
