"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { RATINGS, scheduleReview } from "@/domain/spaced-repetition";
import type { FormState } from "@/features/auth/schemas";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/server/session";

// All writes run as the student; RLS and the ownership triggers make sure a student
// can only ever touch their own decks, cards and reviews.

const SIGNED_OUT: FormState = { status: "error", message: "Your session has ended. Log in again." };

const deckSchema = z.object({
  title: z.string().trim().min(1, "Give the deck a name.").max(80, "Use 80 characters or fewer."),
  subjectId: z.string().uuid().optional().or(z.literal("")),
});

export async function createDeck(_prev: FormState, formData: FormData): Promise<FormState> {
  const student = await getCurrentStudent();
  if (!student) return SIGNED_OUT;
  const parsed = deckSchema.safeParse({ title: formData.get("title"), subjectId: formData.get("subjectId") ?? "" });
  if (!parsed.success) return { status: "error", errors: { title: parsed.error.issues[0]?.message } };
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("flashcard_decks")
    .insert({ title: parsed.data.title, subject_id: parsed.data.subjectId || null })
    .select("id")
    .single();
  if (error || !data) return { status: "error", message: "We couldn't create the deck. Try again." };
  redirect(`/flashcards/${(data as { id: string }).id}`);
}

export async function renameDeck(deckId: string, title: string): Promise<{ ok: boolean; message?: string }> {
  const parsed = deckSchema.shape.title.safeParse(title);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  const supabase = await getServerSupabase();
  const { error } = await supabase.from("flashcard_decks").update({ title: parsed.data }).eq("id", deckId);
  if (error) return { ok: false, message: "We couldn't rename the deck." };
  revalidatePath(`/flashcards/${deckId}`);
  return { ok: true };
}

export async function deleteDeck(deckId: string): Promise<void> {
  const supabase = await getServerSupabase();
  await supabase.from("flashcard_decks").delete().eq("id", deckId);
  revalidatePath("/flashcards");
  redirect("/flashcards");
}

const cardSchema = z.object({
  front: z.string().trim().min(1, "Write the question or prompt.").max(300, "Keep the front under 300 characters."),
  back: z.string().trim().min(1, "Write the answer.").max(600, "Keep the back under 600 characters."),
  explanation: z.string().trim().max(900).optional(),
});

export async function addCard(deckId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const student = await getCurrentStudent();
  if (!student) return SIGNED_OUT;
  const parsed = cardSchema.safeParse({
    front: formData.get("front"),
    back: formData.get("back"),
    explanation: formData.get("explanation") || undefined,
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { status: "error", errors };
  }
  const supabase = await getServerSupabase();
  const { count } = await supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("deck_id", deckId);
  if ((count ?? 0) >= 500) return { status: "error", message: "A deck can hold up to 500 cards." };
  const { error } = await supabase.from("flashcards").insert({
    deck_id: deckId,
    front: parsed.data.front,
    back: parsed.data.back,
    explanation: parsed.data.explanation || null,
    sort_order: count ?? 0,
  });
  if (error) return { status: "error", message: "We couldn't add the card. Try again." };
  await supabase.from("flashcard_decks").update({ updated_at: new Date().toISOString() }).eq("id", deckId);
  await supabase.rpc("check_flashcard_achievements");
  revalidatePath(`/flashcards/${deckId}`);
  return { status: "success", message: "Card added." };
}

export async function deleteCard(deckId: string, cardId: string): Promise<void> {
  const supabase = await getServerSupabase();
  await supabase.from("flashcards").delete().eq("id", cardId);
  revalidatePath(`/flashcards/${deckId}`);
}

const ratingSchema = z.enum(RATINGS);

/** Records a rating and schedules the card's next review. Flipping alone records nothing. */
export async function rateCard(cardId: string, rating: string): Promise<{ ok: boolean; achievements?: string[] }> {
  const parsedRating = ratingSchema.safeParse(rating);
  if (!parsedRating.success) return { ok: false };
  const supabase = await getServerSupabase();
  const { data: existing } = await supabase
    .from("flashcard_reviews")
    .select("interval_days, ease, review_count")
    .eq("card_id", cardId)
    .maybeSingle();
  const previous = existing
    ? {
        intervalDays: Number((existing as { interval_days: number | string }).interval_days),
        ease: Number((existing as { ease: number | string }).ease),
        reviewCount: (existing as { review_count: number }).review_count,
      }
    : null;
  const next = scheduleReview(previous, parsedRating.data);
  const { error } = await supabase.from("flashcard_reviews").upsert(
    {
      card_id: cardId,
      last_rating: parsedRating.data,
      interval_days: next.intervalDays,
      ease: next.ease,
      review_count: next.reviewCount,
      due_at: next.dueAt.toISOString(),
      reviewed_at: new Date().toISOString(),
    },
    { onConflict: "card_id" },
  );
  if (error) return { ok: false };
  const { data: earned } = await supabase.rpc("check_flashcard_achievements");
  return { ok: true, achievements: (earned as string[] | null) ?? [] };
}
