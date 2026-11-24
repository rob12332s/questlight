import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FormAlert } from "@/components/ui/form";
import { dueText } from "@/domain/due-dates";
import { archiveClass, leaveClass, removeStudent, removeWork, resetClassCode } from "@/features/classes/actions";
import { SetWorkForm } from "@/features/classes/class-forms";
import { CopyLinkButton, JoinRoomButton } from "@/features/classes/class-widgets";
import { HostGameForm } from "@/features/play/play-forms";
import { cn } from "@/lib/cn";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCurriculum, todayInLondon } from "@/server/learning";
import { serverNowMs } from "@/server/time";
import { getCurrentStudent } from "@/server/session";

export const metadata: Metadata = { title: "Class" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface BoardRow {
  place: number;
  display_name: string;
  points: number;
  is_me: boolean;
}
interface GameRow {
  room_id: string;
  room_code: string;
  status: "lobby" | "in_progress";
  title: string;
  joined: boolean;
}
interface WorkRow {
  assignment_id: string;
  topic_id: string;
  title: string;
  due_at: string;
  done_count: number;
  student_count: number;
}
interface ProgressRow {
  student_id: string;
  display_name: string;
  status: "done" | "late" | "not_started";
  best_correct: number | null;
  best_total: number | null;
}
interface MyWorkRow {
  assignment_id: string;
  classroom_id: string;
  topic_id: string;
  title: string;
  due_at: string;
  done: boolean;
}
const STATUS_TEXT = { done: "Done", late: "Done late", not_started: "Not done yet" } as const;

interface OverviewRow {
  student_id: string;
  display_name: string;
  joined_at: string;
  xp_week: number;
  quizzes_week: number;
  answers_week: number;
  correct_week: number;
  last_active: string | null;
}

function shortDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" }) : "Not yet";
}

export default async function ClassPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ codeReset?: string; workSet?: string }>;
}) {
  const [{ classId }, { codeReset, workSet }] = await Promise.all([params, searchParams]);
  if (!UUID.test(classId)) notFound();
  const student = await getCurrentStudent();
  if (!student) redirect(`/login?next=/classes/${classId}`);
  const supabase = await getServerSupabase();

  // RLS: only the teacher and the class's students can read it.
  const { data: cls } = await supabase
    .from("classrooms")
    .select("id, name, class_code, teacher_id, archived_at")
    .eq("id", classId)
    .maybeSingle();
  if (!cls) notFound();
  const c = cls as { id: string; name: string; class_code: string; teacher_id: string; archived_at: string | null };
  const isTeacher = c.teacher_id === student.userId;
  const archived = c.archived_at !== null;

  const [{ data: board }, { data: games }, overviewRes, curriculum, workRes] = await Promise.all([
    supabase.rpc("get_class_leaderboard", { p_class: classId }),
    supabase.rpc("get_class_games", { p_class: classId }),
    isTeacher ? supabase.rpc("get_classroom_overview", { p_class: classId }) : Promise.resolve({ data: null }),
    isTeacher && !archived ? getCurriculum() : Promise.resolve([]),
    isTeacher ? supabase.rpc("get_class_assignments", { p_class: classId }) : supabase.rpc("get_my_assignments"),
  ]);
  const now = serverNowMs();
  const work = isTeacher ? ((workRes.data ?? []) as WorkRow[]).slice(0, 12) : [];
  const myWork = isTeacher ? [] : ((workRes.data ?? []) as MyWorkRow[]).filter((w) => w.classroom_id === classId);
  // Per-student progress for the teacher's current and recent work.
  const progress = new Map<string, ProgressRow[]>(
    await Promise.all(
      work.map(async (w) => {
        const { data } = await supabase.rpc("get_assignment_progress", { p_assignment: w.assignment_id });
        return [w.assignment_id, (data ?? []) as ProgressRow[]] as const;
      }),
    ),
  );
  const rows = (board ?? []) as BoardRow[];
  const openGames = (games ?? []) as GameRow[];
  const overview = (overviewRes.data ?? []) as OverviewRow[];

  const leaderboard = (
    <section aria-labelledby="class-board">
      <h2 id="class-board" className="text-lg font-semibold">
        Class leaderboard
      </h2>
      <p className="mt-1 text-sm text-ink-muted">XP earned this week. Starts again every Monday.</p>
      {rows.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-line-strong p-6 text-sm text-ink-soft">
          Nobody in the class has earned XP this week yet.
        </p>
      ) : (
        <ol className="mt-4 divide-y divide-line rounded-xl border border-line">
          {rows.map((r) => (
            <li key={`${r.place}-${r.display_name}-${r.is_me}`} className={cn("flex items-center gap-4 px-4 py-3", r.is_me && "bg-beam-wash")}>
              <span className={cn("tabular w-8 text-right text-sm font-semibold", r.place === 1 ? "text-caution" : "text-ink-muted")}>
                {r.place}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">
                {r.display_name}
                {r.is_me && <span className="font-normal text-ink-muted"> (you)</span>}
              </span>
              <span className="tabular text-sm">
                <span className="font-semibold">{r.points.toLocaleString("en-GB")}</span> <span className="text-ink-muted">XP</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );

  const gamesList = openGames.length > 0 && (
    <ul className="mt-4 divide-y divide-line rounded-xl border border-beam/30 bg-beam-wash">
      {openGames.map((g) => (
        <li key={g.room_id} className="flex items-center justify-between gap-4 px-4 py-3">
          <span className="min-w-0">
            <span className="block truncate font-medium">{g.title}</span>
            <span className="block text-sm text-ink-soft">{g.status === "lobby" ? "Waiting to start" : "In progress"}</span>
          </span>
          {g.joined ? (
            <Link href={`/play/${g.room_id}`} className="text-sm font-medium text-beam-bright underline-offset-4 hover:underline">
              {isTeacher ? "Open" : "Rejoin"}
            </Link>
          ) : g.status === "lobby" ? (
            <JoinRoomButton code={g.room_code} label="Join game" />
          ) : (
            <span className="text-sm text-ink-muted">Already started</span>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div>
      <p className="text-sm">
        <Link href="/classes" className="text-ink-muted underline-offset-4 hover:text-ink hover:underline">
          All classes
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{c.name}</h1>
      {archived && <p className="mt-2 text-ink-soft">This class is archived. Its history is kept, but nobody can join it.</p>}

      {isTeacher ? (
        <div className="mt-8 space-y-12">
          {!archived && (
            <section aria-labelledby="class-code" className="rounded-xl border border-line bg-deep p-6">
              <h2 id="class-code" className="text-sm text-ink-soft">
                Class code
              </h2>
              <p className="tabular mt-2 text-4xl font-semibold tracking-[0.18em]">
                <span aria-hidden data-testid="class-code">
                  {c.class_code}
                </span>
                <span className="sr-only">{c.class_code.split("").join(" ")}</span>
              </p>
              <p className="mt-2 text-sm text-ink-muted">Students go to Classes, choose Join a class, and type this code.</p>
              {codeReset && (
                <div className="mt-4">
                  <FormAlert tone="success">New code made. The old one no longer works.</FormAlert>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <CopyLinkButton path={`/classes?code=${c.class_code}`} label="Copy join link" />
                <form action={resetClassCode}>
                  <input type="hidden" name="classId" value={c.id} />
                  <button type="submit" className="h-9 rounded-md px-3 text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline">
                    Make a new code
                  </button>
                </form>
              </div>
            </section>
          )}

          {!archived && (
            <section aria-labelledby="class-games">
              <h2 id="class-games" className="text-lg font-semibold">
                Class games
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Only students in this class can join. You host on the board; students answer on their own devices.
              </p>
              {gamesList}
              <div className="mt-6 rounded-xl border border-line bg-deep p-6">
                <HostGameForm
                  classroomId={c.id}
                  subjects={curriculum
                    .filter((s) => s.topics.length > 0)
                    .map((s) => ({ id: s.id, name: s.name, topics: s.topics.map((t) => ({ id: t.id, name: t.name })) }))}
                />
              </div>
            </section>
          )}

          <section aria-labelledby="set-work-h" id="set-work" className="scroll-mt-24">
            <h2 id="set-work-h" className="text-lg font-semibold">
              Work set
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Set a topic quiz with a due date. A student has done it once they finish a quiz on that topic.
            </p>
            {workSet && (
              <div className="mt-4">
                <FormAlert tone="success">Work set. Students will see it on their dashboard and on this class page.</FormAlert>
              </div>
            )}
            {!archived && (
              <div className="mt-4 rounded-xl border border-line bg-deep p-5">
                <SetWorkForm
                  classId={c.id}
                  minDate={todayInLondon()}
                  subjects={curriculum
                    .filter((s) => s.topics.length > 0)
                    .map((s) => ({ id: s.id, name: s.name, topics: s.topics.map((t) => ({ id: t.id, name: t.name })) }))}
                />
              </div>
            )}
            {work.length > 0 && (
              <ul className="mt-4 space-y-2">
                {work.map((w) => {
                  const rows = progress.get(w.assignment_id) ?? [];
                  return (
                    <li key={w.assignment_id}>
                      <details className="group rounded-xl border border-line">
                        <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-3">
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium">{w.title}</span>
                            <span className="block text-sm text-ink-muted">{dueText(w.due_at, now)}</span>
                          </span>
                          <span className="tabular text-sm">
                            <span className="font-semibold">{w.done_count}</span>
                            <span className="text-ink-muted"> of {w.student_count} done</span>
                          </span>
                        </summary>
                        <div className="border-t border-line px-4 py-3">
                          {rows.length === 0 ? (
                            <p className="text-sm text-ink-muted">No students in the class yet.</p>
                          ) : (
                            <ul className="divide-y divide-line text-sm">
                              {rows.map((r) => (
                                <li key={r.student_id} className="flex items-center justify-between gap-3 py-2">
                                  <span className="font-medium">{r.display_name}</span>
                                  <span className={cn("tabular", r.status === "not_started" ? "text-ink-muted" : r.status === "late" ? "text-caution" : "text-correct")}>
                                    {STATUS_TEXT[r.status]}
                                    {r.best_total ? `, best ${r.best_correct}/${r.best_total}` : ""}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                          <form action={removeWork} className="mt-3">
                            <input type="hidden" name="classId" value={c.id} />
                            <input type="hidden" name="assignmentId" value={w.assignment_id} />
                            <button type="submit" className="text-sm text-ink-muted underline-offset-4 hover:text-incorrect hover:underline">
                              Remove this work
                            </button>
                          </form>
                        </div>
                      </details>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="students">
            <h2 id="students" className="text-lg font-semibold">
              Students <span className="tabular text-ink-soft">({overview.length})</span>
            </h2>
            {overview.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-line-strong p-6 text-sm text-ink-soft">
                No students yet. Share the class code to get started.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-line">
                <table className="w-full min-w-[36rem] text-left text-sm">
                  <caption className="sr-only">Students and their activity this week</caption>
                  <thead className="text-ink-muted">
                    <tr className="border-b border-line">
                      <th scope="col" className="px-4 py-2.5 font-medium">Name</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-medium">XP this week</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-medium">Quizzes this week</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-medium">Accuracy this week</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Last active</th>
                      <th scope="col" className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {overview.map((s) => (
                      <tr key={s.student_id}>
                        <th scope="row" className="px-4 py-2.5 font-medium">{s.display_name}</th>
                        <td className="tabular px-4 py-2.5 text-right">{s.xp_week}</td>
                        <td className="tabular px-4 py-2.5 text-right">{s.quizzes_week}</td>
                        <td className="tabular px-4 py-2.5 text-right">
                          {s.answers_week > 0 ? `${Math.round((100 * s.correct_week) / s.answers_week)}%` : "No answers"}
                        </td>
                        <td className="tabular px-4 py-2.5 text-ink-soft">{shortDate(s.last_active)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <form action={removeStudent}>
                            <input type="hidden" name="classId" value={c.id} />
                            <input type="hidden" name="studentId" value={s.student_id} />
                            <button type="submit" className="text-ink-muted underline-offset-4 hover:text-incorrect hover:underline">
                              Remove<span className="sr-only"> {s.display_name}</span>
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-2 text-xs text-ink-muted">Accuracy counts solo quiz answers. A removed student can rejoin with the current code.</p>
          </section>

          {leaderboard}

          {!archived && (
            <details className="rounded-xl border border-line p-5">
              <summary className="cursor-pointer text-sm font-medium text-ink-soft">Archive this class</summary>
              <p className="mt-3 text-sm text-ink-soft">
                Archiving stops anyone joining and closes any game waiting to start. Students keep their own progress. This can&apos;t
                be undone from the site.
              </p>
              <form action={archiveClass} className="mt-4">
                <input type="hidden" name="classId" value={c.id} />
                <input type="hidden" name="confirm" value="archive" />
                <button type="submit" className="h-9 rounded-md bg-incorrect/15 px-3 text-sm font-medium text-ink shadow-[inset_0_0_0_1px_var(--color-incorrect)] hover:bg-incorrect/25">
                  Archive {c.name}
                </button>
              </form>
            </details>
          )}
        </div>
      ) : (
        <div className="mt-8 space-y-12">
          <section aria-labelledby="my-work">
            <h2 id="my-work" className="text-lg font-semibold">
              Work set by your teacher
            </h2>
            {myWork.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-line-strong p-6 text-sm text-ink-soft">
                Nothing set right now.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
                {myWork.map((w) => (
                  <li key={w.assignment_id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="min-w-0">
                      <span className="block font-medium">{w.title}</span>
                      <span className={cn("block text-sm", w.done ? "text-correct" : Date.parse(w.due_at) <= now ? "text-caution" : "text-ink-muted")}>
                        {w.done ? "Done" : dueText(w.due_at, now)}
                      </span>
                    </span>
                    <Link
                      href={`/quizzes?topic=${w.topic_id}`}
                      className="shrink-0 text-sm font-medium text-beam-bright underline-offset-4 hover:underline"
                    >
                      {w.done ? "Practise again" : "Start quiz"}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="class-games">
            <h2 id="class-games" className="text-lg font-semibold">
              Class games
            </h2>
            {openGames.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-line-strong p-6 text-sm text-ink-soft">
                No class game is open right now. When your teacher starts one, it appears here.
              </p>
            ) : (
              gamesList
            )}
          </section>

          {leaderboard}

          <form action={leaveClass} className="border-t border-line pt-4">
            <input type="hidden" name="classId" value={c.id} />
            <p className="text-sm text-ink-muted">
              Your teacher sees your display name and your activity this week.{" "}
              <button type="submit" className="underline underline-offset-4 hover:text-ink">
                Leave this class
              </button>
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
