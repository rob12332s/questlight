import type { Metadata } from "next";
import { Award, Lock } from "lucide-react";
import { redirect } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/cn";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/server/session";

export const metadata: Metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  const student = await getCurrentStudent();
  if (!student) redirect("/login?next=/achievements");
  const supabase = await getServerSupabase();
  const [{ data: all }, { data: mine }] = await Promise.all([
    supabase.from("achievements").select("id, name, description, xp_reward").order("sort_order"),
    supabase.from("user_achievements").select("achievement_id, earned_at").eq("player_id", student.userId),
  ]);
  const earned = new Map(((mine ?? []) as Array<{ achievement_id: string; earned_at: string }>).map((r) => [r.achievement_id, r.earned_at]));
  const list = (all ?? []) as Array<{ id: string; name: string; description: string; xp_reward: number }>;

  return (
    <div>
      <h1 className="text-3xl font-semibold sm:text-4xl">Achievements</h1>
      <p className="mt-2 text-ink-soft">
        <span className="tabular">{earned.size}</span> of <span className="tabular">{list.length}</span> earned. Each one rewards real
        learning, not time spent.
      </p>
      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {list.map((a, i) => {
          const when = earned.get(a.id);
          return (
            <Reveal as="li" key={a.id} delay={(i % 2) * 70}>
              <div
                className={cn(
                  "flex h-full gap-4 rounded-xl border p-5 transition-colors",
                  when ? "border-beam/40 bg-deep" : "border-line",
                )}
              >
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                    when ? "bg-beam-wash text-beam-bright" : "bg-slate text-ink-muted",
                  )}
                >
                  {when ? <Award className="h-5 w-5" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
                </span>
                <div className="min-w-0">
                  <h2 className={cn("font-medium", !when && "text-ink-soft")}>{a.name}</h2>
                  <p className="mt-0.5 text-sm text-ink-muted">{a.description}</p>
                  <p className="tabular mt-2 text-xs text-ink-muted">
                    {when
                      ? `Earned ${new Date(when).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, +${a.xp_reward} XP`
                      : `+${a.xp_reward} XP`}
                    <span className="sr-only">{when ? "" : ", not earned yet"}</span>
                  </p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </ul>
    </div>
  );
}
