import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { studyOrder } from "@/domain/spaced-repetition";
import { StudySession } from "@/features/flashcards/study-session";
import { getDeck } from "@/server/flashcards";
import { getCurrentStudent } from "@/server/session";

export const metadata: Metadata = { title: "Review" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function StudyPage({
  params,
  searchParams,
}: {
  params: Promise<{ deckId: string }>;
  searchParams: Promise<{ all?: string }>;
}) {
  const [{ deckId }, { all }] = await Promise.all([params, searchParams]);
  if (!UUID.test(deckId)) notFound();
  const student = await getCurrentStudent();
  if (!student) redirect(`/login?next=/flashcards/${deckId}/study`);
  const deck = await getDeck(deckId);
  if (!deck) notFound();

  const withDates = deck.cards.map((c) => ({ ...c, dueAt: c.dueAt ? new Date(c.dueAt) : null, createdAt: new Date(c.createdAt) }));
  const cards = all ? withDates : studyOrder(withDates);

  return (
    <div>
      <Link href={`/flashcards/${deck.id}`} className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ChevronLeft className="h-4 w-4" aria-hidden /> {deck.title}
      </Link>
      <h1 className="mt-3 mb-8 text-2xl font-semibold">Review</h1>
      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong p-6 text-ink-soft">
          Nothing to review right now. Come back later, or{" "}
          <Link href={`/flashcards/${deck.id}/study?all=1`} className="text-ink underline underline-offset-4">
            practise all cards
          </Link>
          .
        </p>
      ) : (
        <StudySession
          deckId={deck.id}
          cards={cards.map((c) => ({ id: c.id, front: c.front, back: c.back, explanation: c.explanation }))}
        />
      )}
    </div>
  );
}
