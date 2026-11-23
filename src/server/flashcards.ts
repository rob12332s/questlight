import "server-only";

import { getServerSupabase } from "@/lib/supabase/server";

export interface DeckSummary {
  id: string;
  title: string;
  subjectName: string | null;
  cardCount: number;
  dueCount: number;
  updatedAt: string;
}

export interface CardRow {
  id: string;
  front: string;
  back: string;
  explanation: string | null;
  createdAt: string;
  dueAt: string | null;
  lastRating: "needs_practice" | "learning" | "confident" | null;
}

export async function getDecks(): Promise<DeckSummary[]> {
  const supabase = await getServerSupabase();
  const [{ data: decks }, { data: cards }, { data: reviews }] = await Promise.all([
    supabase.from("flashcard_decks").select("id, title, updated_at, subjects(name)").order("updated_at", { ascending: false }),
    supabase.from("flashcards").select("id, deck_id"),
    supabase.from("flashcard_reviews").select("card_id, due_at"),
  ]);
  const now = Date.now();
  const dueByCard = new Map(((reviews ?? []) as Array<{ card_id: string; due_at: string }>).map((r) => [r.card_id, new Date(r.due_at).getTime()]));
  const stats = new Map<string, { cards: number; due: number }>();
  for (const c of (cards ?? []) as Array<{ id: string; deck_id: string }>) {
    const s = stats.get(c.deck_id) ?? { cards: 0, due: 0 };
    s.cards += 1;
    const due = dueByCard.get(c.id);
    if (due === undefined || due <= now) s.due += 1;
    stats.set(c.deck_id, s);
  }
  return ((decks ?? []) as unknown as Array<{ id: string; title: string; updated_at: string; subjects: { name: string } | null }>).map((d) => ({
    id: d.id,
    title: d.title,
    subjectName: d.subjects?.name ?? null,
    cardCount: stats.get(d.id)?.cards ?? 0,
    dueCount: stats.get(d.id)?.due ?? 0,
    updatedAt: d.updated_at,
  }));
}

export async function getDeck(deckId: string): Promise<{ id: string; title: string; isAiGenerated: boolean; cards: CardRow[] } | null> {
  const supabase = await getServerSupabase();
  const { data: deck } = await supabase.from("flashcard_decks").select("id, title, is_ai_generated").eq("id", deckId).maybeSingle();
  if (!deck) return null;
  const { data: cards } = await supabase
    .from("flashcards")
    .select("id, front, back, explanation, created_at, flashcard_reviews(due_at, last_rating)")
    .eq("deck_id", deckId)
    .order("sort_order")
    .order("created_at");
  const d = deck as { id: string; title: string; is_ai_generated: boolean };
  return {
    id: d.id,
    title: d.title,
    isAiGenerated: d.is_ai_generated,
    cards: ((cards ?? []) as unknown as Array<{
      id: string;
      front: string;
      back: string;
      explanation: string | null;
      created_at: string;
      flashcard_reviews: { due_at: string; last_rating: CardRow["lastRating"] } | Array<{ due_at: string; last_rating: CardRow["lastRating"] }> | null;
    }>).map((c) => {
      const review = Array.isArray(c.flashcard_reviews) ? c.flashcard_reviews[0] : c.flashcard_reviews;
      return {
        id: c.id,
        front: c.front,
        back: c.back,
        explanation: c.explanation,
        createdAt: c.created_at,
        dueAt: review?.due_at ?? null,
        lastRating: review?.last_rating ?? null,
      };
    }),
  };
}
