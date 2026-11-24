import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormAlert } from "@/components/ui/form";
import { CreateClassForm, JoinClassForm } from "@/features/classes/class-forms";
import { getMyClasses } from "@/server/classes";
import { getCurrentStudent } from "@/server/session";

export const metadata: Metadata = { title: "Classes" };

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; left?: string; archived?: string }>;
}) {
  const student = await getCurrentStudent();
  if (!student) redirect("/login?next=/classes");
  const [{ code, left, archived }, classes] = await Promise.all([searchParams, getMyClasses(student.userId)]);
  const isTeacher = student.profile.account_type === "teacher";
  const teaching = classes.filter((c) => c.isTeacher);
  const joined = classes.filter((c) => !c.isTeacher && !c.archived);

  return (
    <div>
      <h1 className="text-3xl font-semibold sm:text-4xl">Classes</h1>
      <p className="mt-2 max-w-xl text-ink-soft">
        {isTeacher
          ? "Create a class, share its code, then host live games for it and see how your students are getting on."
          : "Join your teacher's class with the code they give you, to play class games and see the class leaderboard."}
      </p>

      {(left || archived) && (
        <div className="mt-6 max-w-xl">
          <FormAlert tone="success">{left ? "You've left the class." : "Class archived."}</FormAlert>
        </div>
      )}

      {isTeacher && (
        <section aria-labelledby="teaching" className="mt-10">
          <h2 id="teaching" className="text-lg font-semibold">
            Classes you teach
          </h2>
          <div className="mt-4 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
            {teaching.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line-strong p-6 text-sm text-ink-soft">
                No classes yet. Create one, then share its code with your students.
              </p>
            ) : (
              <ul className="divide-y divide-line self-start rounded-xl border border-line">
                {teaching.map((c) => (
                  <li key={c.id}>
                    <Link href={`/classes/${c.id}`} className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-slate/50">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{c.name}</span>
                        <span className="block text-sm text-ink-muted">{c.archived ? "Archived" : "Active"}</span>
                      </span>
                      {!c.archived && <span className="tabular text-sm font-semibold tracking-[0.2em] text-ink-soft">{c.code}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="self-start rounded-xl border border-line bg-deep p-6">
              <h3 className="font-semibold">New class</h3>
              <div className="mt-4">
                <CreateClassForm />
              </div>
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="joined" className="mt-10">
        <h2 id="joined" className="text-lg font-semibold">
          {isTeacher ? "Classes you've joined" : "Your classes"}
        </h2>
        <div className="mt-4 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          {joined.length === 0 ? (
            <p className="flex items-start gap-3 self-start rounded-xl border border-dashed border-line-strong p-6 text-sm text-ink-soft">
              <GraduationCap className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              You haven&apos;t joined a class yet. Ask your teacher for the class code.
            </p>
          ) : (
            <ul className="divide-y divide-line self-start rounded-xl border border-line">
              {joined.map((c) => (
                <li key={c.id}>
                  <Link href={`/classes/${c.id}`} className="block px-4 py-3.5 font-medium transition-colors hover:bg-slate/50">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="self-start rounded-xl border border-line bg-deep p-6">
            <h3 className="font-semibold">Join a class</h3>
            <div className="mt-4">
              <JoinClassForm initialCode={code} />
            </div>
          </div>
        </div>
      </section>

      {!isTeacher && (
        <p className="mt-10 max-w-xl text-sm text-ink-muted">
          Are you a teacher? Teacher accounts are set up by the Questlight team, so students can trust who runs a class.
        </p>
      )}
    </div>
  );
}
