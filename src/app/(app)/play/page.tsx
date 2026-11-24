import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Challenges, type Challenge } from "@/features/play/challenges";
import { HostGameForm, JoinGameForm } from "@/features/play/play-forms";
import { getCurriculum } from "@/server/learning";
import { getOpenRooms } from "@/server/play";
import { getCurrentStudent } from "@/server/session";

export const metadata: Metadata = { title: "Live games" };

export default async function PlayPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const student = await getCurrentStudent();
  if (!student) redirect("/login?next=/play");
  const [{ code }, curriculum, rooms] = await Promise.all([searchParams, getCurriculum(), getOpenRooms()]);

  // Ready-made topic challenges: one tap creates a room to share.
  const scope = (subject: string, topic?: string): string | null => {
    const s = curriculum.find((x) => x.slug === subject);
    if (!s) return null;
    if (!topic) return s.topics.length > 0 ? `${s.id}:all` : null;
    const t = s.topics.find((x) => x.slug === topic);
    return t ? `${s.id}:${t.id}` : null;
  };
  const challenges = (
    [
      { title: "Algebra challenge", detail: "Equations and expressions, head to head.", scope: scope("maths", "algebra-equations-expressions") },
      { title: "Biology knowledge challenge", detail: "Every biology topic in the question bank.", scope: scope("biology") },
      { title: "English analysis challenge", detail: "Spot the technique and its effect.", scope: scope("english-language", "language-techniques") },
      { title: "Forces challenge", detail: "Physics: forces and motion.", scope: scope("physics", "forces") },
      { title: "History challenge", detail: "Every history topic in the question bank.", scope: scope("history") },
      { title: "Mixed GCSE challenge", detail: "Questions from every subject.", scope: curriculum.length > 0 ? "mixed" : null },
    ] satisfies { title: string; detail: string; scope: string | null }[]
  ).filter((c): c is Challenge => c.scope !== null);

  return (
    <div>
      <h1 className="text-3xl font-semibold sm:text-4xl">Live games</h1>
      <p className="mt-2 max-w-xl text-ink-soft">
        Play with friends or your class. Everyone gets the same question at the same time; right answers score, and faster
        right answers score a little more.
      </p>

      {rooms.length > 0 && (
        <section aria-labelledby="your-games" className="mt-8 animate-enter">
          <h2 id="your-games" className="text-lg font-semibold">
            Your open games
          </h2>
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
            {rooms.map((room) => (
              <li key={room.id}>
                <Link
                  href={`/play/${room.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-slate/50"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{room.name}</span>
                    <span className="block text-sm text-ink-muted">
                      {room.status === "lobby" ? "Waiting to start" : "In progress"}
                      {room.hostId === student.userId ? ", you're hosting" : ""}
                    </span>
                  </span>
                  <span className="tabular shrink-0 font-semibold text-sm tracking-[0.2em] text-ink-soft">{room.roomCode}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {challenges.length > 0 && (
        <section aria-labelledby="challenges" className="mt-10 animate-enter">
          <h2 id="challenges" className="text-lg font-semibold">
            Topic challenges
          </h2>
          <p className="mt-1 text-sm text-ink-muted">Start a room in one tap, then share the code with friends.</p>
          <Challenges challenges={challenges} />
        </section>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.25fr]">
        <section aria-labelledby="join-game" className="animate-enter rounded-xl border border-line bg-deep p-6 [animation-delay:60ms]">
          <h2 id="join-game" className="text-lg font-semibold">
            Join a game
          </h2>
          <div className="mt-5">
            <JoinGameForm initialCode={code} />
          </div>
        </section>

        <section aria-labelledby="host-game" className="animate-enter rounded-xl border border-line bg-deep p-6 [animation-delay:120ms]">
          <h2 id="host-game" className="text-lg font-semibold">
            Host a game
          </h2>
          <p className="mt-1 text-sm text-ink-muted">You get a code to share. You play too.</p>
          <div className="mt-5">
            <HostGameForm
              subjects={curriculum
                .filter((s) => s.topics.length > 0)
                .map((s) => ({ id: s.id, name: s.name, topics: s.topics.map((t) => ({ id: t.id, name: t.name })) }))}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
