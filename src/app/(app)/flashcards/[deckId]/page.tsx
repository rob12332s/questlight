import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { RATING_LABELS } from "@/domain/spaced-repetition";
import { AddCardForm, DeckSettings, DeleteCardButton } from "@/features/flashcards/deck-forms";
import { getDeck } from "@/server/flashcards";
import { getCurrentStudent } from "@/server/session";

export const metadata: Metadata = { title: "Deck" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function DeckPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params;
  if (!UUID.test(deckId)) notFound();
  const student = await getCurrentStudent();
  if (!student) redirect(`/login?next=/flashcards/${deckId}`);
  const deck = await getDeck(deckId);
  if (!deck) notFound();

  const now = Date.now();
  const due = deck.cards.filter((c) => c.dueAt === null || new Date(c.dueAt).getTime() <= now).length;

  return (
    <div>
      <Link href="/flashcards" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ChevronLeft className="h-4 w-4" aria-hidden /> All decks
      </Link>
      <header className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">{deck.title}</h1>
          <p className="tabular mt-2 text-ink-soft">
            {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}
            {deck.cards.length > 0 && `, ${due} to review now`}
            {deck.isAiGenerated && ", AI-generated (check before relying on it)"}
          </p>
        </div>
        {deck.cards.length > 0 &&
          (due > 0 ? (
            <ButtonLink href={`/flashcards/${deck.id}/study`} size="lg">
              Review {due} {due === 1 ? "card" : "cards"}
            </ButtonLink>
          ) : (
            <ButtonLink href={`/flashcards/${deck.id}/study?all=1`} size="lg" variant="secondary">
              Practise all cards
            </ButtonLink>
          ))}
      </header>

      <section aria-labelledby="add-card" className="mt-10 rounded-xl border border-line bg-deep p-6">
        <h2 id="add-card" className="text-lg font-semibold">
          Add a card
        </h2>
        <div className="mt-4">
          <AddCardForm deckId={deck.id} />
        </div>
      </section>

      <section aria-labelledby="cards-heading" className="mt-10">
        <h2 id="cards-heading" className="text-lg font-semibold">
          Cards
        </h2>
        {deck.cards.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-line-strong p-6 text-sm text-ink-soft">
            No cards yet. Add your first one above. Short, single-fact cards work best.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line">
            {deck.cards.map((card) => (
              <li key={card.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
                <p className="text-[0.9375rem]">{card.front}</p>
                <p className="text-[0.9375rem] text-ink-soft">{card.back}</p>
                <div className="flex items-center gap-2 sm:justify-end">
                  <span className="text-xs text-ink-muted">{card.lastRating ? RATING_LABELS[card.lastRating] : "New"}</span>
                  <DeleteCardButton deckId={deck.id} cardId={card.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="deck-settings" className="mt-10 border-t border-line pt-8">
        <h2 id="deck-settings" className="text-lg font-semibold">
          Deck settings
        </h2>
        <div className="mt-4 max-w-lg">
          <DeckSettings deckId={deck.id} title={deck.title} />
        </div>
      </section>
    </div>
  );
}
