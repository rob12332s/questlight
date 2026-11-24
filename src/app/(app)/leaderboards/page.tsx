import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { levelFromXp } from "@/domain/progression";
import { setLeaderboardVisibility } from "@/features/leaderboards/actions";
import { cn } from "@/lib/cn";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/server/session";

export const metadata: Metadata = { title: "Leaderboards" };

const BOARDS = [
  { id: "week", label: "This week" },
  { id: "all_time", label: "All time" },
  { id: "played_with", label: "Played with" },
] as const;
type BoardId = (typeof BOARDS)[number]["id"];

interface Row {
  place: number;
  display_name: string;
  points: number;
  is_me: boolean;
  is_hidden: boolean;
}

const EMPTY: Record<BoardId, string> = {
  week: "Nobody else is on this week's board yet. Finish a quiz or a live game to get on it.",
  all_time: "Nobody else is on this board yet. Finish a quiz or a live game to get on it.",
  played_with:
    "Students you finish a live game with appear here, if they've chosen to show their name. Start one from Multiplayer.",
};

export default async function LeaderboardsPage({ searchParams }: { searchParams: Promise<{ board?: string }> }) {
  const student = await getCurrentStudent();
  if (!student) redirect("/login?next=/leaderboards");
  const { board: requested } = await searchParams;
  const board: BoardId = BOARDS.some((b) => b.id === requested) ? (requested as BoardId) : "week";
  const label = BOARDS.find((b) => b.id === board)?.label ?? "This week";

  const supabase = await getServerSupabase();
  const [{ data, error }, { data: profile }] = await Promise.all([
    supabase.rpc("get_leaderboard", { p_board: board }),
    supabase.from("profiles").select("show_on_leaderboards").eq("id", student.userId).maybeSingle(),
  ]);
  const rows = (data ?? []) as Row[];
  const others = rows.filter((r) => !r.is_me);
  const me = rows.find((r) => r.is_me);
  const showing = Boolean((profile as { show_on_leaderboards?: boolean } | null)?.show_on_leaderboards);

  return (
    <div>
      <h1 className="text-3xl font-semibold sm:text-4xl">Leaderboards</h1>
      <p className="mt-2 max-w-xl text-ink-soft">
        XP comes from quizzes, live games and achievements. The weekly boards start again every Monday.
      </p>

      <nav aria-label="Leaderboards" className="mt-8">
        <ul className="inline-grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-deep p-1 shadow-[inset_0_0_0_1px_var(--color-line)]">
          {BOARDS.map((b) => (
            <li key={b.id}>
              <Link
                href={`/leaderboards?board=${b.id}`}
                aria-current={b.id === board ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center justify-center rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors duration-200 sm:px-4",
                  b.id === board ? "bg-slate-raised text-ink shadow-raised" : "text-ink-soft hover:text-ink",
                )}
              >
                {b.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {!showing && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-beam/30 bg-beam-wash p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink">
            Your name is hidden, so other students can&apos;t see you on leaderboards. Only you can see your own place.
          </p>
          <form action={setLeaderboardVisibility}>
            <input type="hidden" name="show" value="true" />
            <input type="hidden" name="board" value={board} />
            <button
              type="submit"
              className="h-9 shrink-0 rounded-md bg-beam px-3 text-sm font-medium whitespace-nowrap text-night transition-colors hover:bg-beam-bright"
            >
              Show my name
            </button>
          </form>
        </div>
      )}

      <section aria-labelledby="board-heading" className="mt-8">
        <h2 id="board-heading" className="sr-only">
          {label}
        </h2>
        {error ? (
          <p className="rounded-xl border border-dashed border-line-strong p-6 text-sm text-ink-soft">
            We couldn&apos;t load this leaderboard. Refresh the page to try again.
          </p>
        ) : (
          <>
            {rows.length > 0 && (
              <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                {rows.map((row, i) => (
                  <Reveal as="li" key={`${row.is_me ? "me" : row.place}-${row.display_name}`} delay={Math.min(i, 10) * 30}>
                    <div className={cn("flex items-center gap-4 px-4 py-3", row.is_me && "bg-beam-wash")}>
                      <span
                        className={cn(
                          "tabular w-8 text-right text-sm font-semibold",
                          row.place === 1 ? "text-caution" : row.place <= 3 ? "text-ink" : "text-ink-muted",
                        )}
                      >
                        {row.place}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {row.display_name}
                          {row.is_me && <span className="font-normal text-ink-muted"> (you)</span>}
                        </span>
                        {row.is_me && row.is_hidden && (
                          <span className="block text-xs text-ink-muted">Hidden from other students</span>
                        )}
                      </span>
                      {board === "all_time" && (
                        <span className="tabular hidden text-sm text-ink-muted sm:inline">
                          Level {levelFromXp(row.points).level}
                        </span>
                      )}
                      <span className="tabular w-24 text-right text-sm">
                        <span className="font-semibold">{row.points.toLocaleString("en-GB")}</span>{" "}
                        <span className="text-ink-muted">XP</span>
                      </span>
                    </div>
                  </Reveal>
                ))}
              </ol>
            )}
            {others.length === 0 && <p className="mt-4 text-sm text-ink-soft">{EMPTY[board]}</p>}
            {me && me.points === 0 && others.length > 0 && (
              <p className="mt-4 text-sm text-ink-muted">Finish a quiz or a live game to earn XP and move up.</p>
            )}
          </>
        )}
      </section>

      {showing && (
        <form action={setLeaderboardVisibility} className="mt-10 border-t border-line pt-4">
          <input type="hidden" name="show" value="false" />
          <input type="hidden" name="board" value={board} />
          <p className="text-sm text-ink-muted">
            Other students can see your display name and XP here.{" "}
            <button type="submit" className="underline underline-offset-4 hover:text-ink">
              Hide my name
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
