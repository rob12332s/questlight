import type { Metadata } from "next";
import { Layers } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { CreateDeckForm } from "@/features/flashcards/deck-forms";
import { getServerSupabase } from "@/lib/supabase/server";
import { getDecks } from "@/server/flashcards";
import { getCurrentStudent } from "@/server/session";

export const metadata: Metadata = { title: "Flashcards" };

export default async function FlashcardsPage() {
  const student = await getCurrentStudent();
  if (!student) redirect("/login?next=/flashcards");
  const supabase = await getServerSupabase();
  const [decks, { data: subjects }] = await Promise.all([
    getDecks(),
    supabase.from("subjects").select("id, name").order("sort_order"),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-semibold sm:text-4xl">Flashcards</h1>
      <p className="mt-2 max-w-xl text-ink-soft">
        Make decks, then review them. Cards you find hard come back sooner; cards you know come back less often.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <section aria-labelledby="decks-heading">
          <h2 id="decks-heading" className="text-lg font-semibold">
            Your decks
          </h2>
          {decks.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-line-strong p-8 text-center">
              <Layers className="mx-auto h-8 w-8 text-ink-muted" aria-hidden />
              <p className="mt-3 font-medium">No decks yet</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">Create your first deck, then add a few cards to start reviewing.</p>
            </div>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {decks.map((deck, i) => (
                <Reveal as="li" key={deck.id} delay={(i % 2) * 60}>
                  <Link
                    href={`/flashcards/${deck.id}`}
                    className="group relative flex h-full flex-col rounded-xl border border-line bg-deep p-5 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-line-strong"
                  >
                    {/* Stacked-card edge: a quiet hint that this is a deck */}
                    <span aria-hidden className="absolute inset-x-3 -bottom-1.5 -z-10 h-3 rounded-b-xl border border-t-0 border-line bg-deep/60" />
                    <span className="font-medium">{deck.title}</span>
                    {deck.subjectName && <span className="text-sm text-ink-muted">{deck.subjectName}</span>}
                    <span className="tabular mt-4 text-sm text-ink-soft">
                      {deck.cardCount} {deck.cardCount === 1 ? "card" : "cards"}
                      {deck.cardCount > 0 && (
                        <span className={deck.dueCount > 0 ? "text-beam-bright" : "text-ink-muted"}>
                          {deck.dueCount > 0 ? `, ${deck.dueCount} to review` : ", all reviewed"}
                        </span>
                      )}
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="new-deck" className="h-fit rounded-xl border border-line p-6">
          <h2 id="new-deck" className="text-lg font-semibold">
            New deck
          </h2>
          <div className="mt-4">
            <CreateDeckForm subjects={(subjects ?? []) as Array<{ id: string; name: string }>} />
          </div>
        </section>
      </div>
    </div>
  );
}
