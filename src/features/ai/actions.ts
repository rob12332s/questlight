"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  AI_INPUT_LIMITS,
  EXPLAIN_LEVELS,
  buildExplainPrompt,
  buildFlashcardsPrompt,
  buildQuestionsPrompt,
  cleanInput,
  extractJson,
  parseExplanation,
  parseFlashcards,
  parseQuestions,
  type Explanation,
  type Prompt,
  type TopicContext,
} from "@/domain/ai-content";
import type { ValidatedQuestion } from "@/domain/question-validation";
import { DIFFICULTIES } from "@/domain/types";
import { parseAiConfig } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";
import { callModel } from "@/server/ai/provider";
import { getCurrentStudent } from "@/server/session";

type RequestType = "explanation" | "questions" | "flashcards";

export type ExplainState = { error?: string; result?: Explanation & { topic: string; question: string } };
export type PracticeState = { error?: string; result?: { topic: string; questions: ValidatedQuestion[]; requestId: number } };
export type FlashcardState = { error?: string };

const OFF = "AI study help isn't switched on for this site yet.";
const LIMIT: Record<RequestType, string> = {
  explanation: "You've used today's 20 explanations. They reset 24 hours after you used them.",
  questions: "You've used today's 30 AI practice questions. They reset 24 hours after you used them.",
  flashcards: "You've made 5 AI flashcard decks today. You can make more tomorrow.",
};
const FAILED = "The AI helper didn't respond properly. Try again in a moment.";

/** Shared steps: sign-in, config, topic lookup, allowance claim, model call, outcome log. */
async function runAi<T>(
  type: RequestType,
  items: number,
  topicId: string,
  build: (ctx: TopicContext) => Prompt,
  parse: (raw: unknown, ctx: TopicContext) => { value: T | null; delivered: number },
): Promise<{ ok: true; value: T; ctx: TopicContext } | { ok: false; error: string }> {
  const student = await getCurrentStudent();
  if (!student) redirect("/login?next=/ai-study");

  let config;
  try {
    config = parseAiConfig(process.env);
  } catch {
    config = null;
  }
  if (!config) return { ok: false, error: OFF };

  const supabase = await getServerSupabase();
  const { data: topic } = await supabase
    .from("topics")
    .select("name, subjects(name)")
    .eq("id", topicId)
    .maybeSingle();
  const t = topic as { name: string; subjects: { name: string } | null } | null;
  if (!t) return { ok: false, error: "Choose a topic from the list." };
  const ctx: TopicContext = { subject: t.subjects?.name ?? "GCSE", topic: t.name };

  const { data: claim, error: claimError } = await supabase.rpc("claim_ai_request", { p_type: type, p_items: items });
  const c = claim as { ok?: boolean; log_id?: string } | null;
  if (claimError || !c) return { ok: false, error: "Something went wrong. Try again." };
  if (!c.ok || !c.log_id) return { ok: false, error: LIMIT[type] };

  try {
    const reply = await callModel(config, build(ctx));
    const parsed = parse(extractJson(reply), ctx);
    if (parsed.value === null) {
      await supabase.rpc("finish_ai_request", { p_log: c.log_id, p_status: "rejected", p_delivered: 0 });
      return { ok: false, error: FAILED };
    }
    await supabase.rpc("finish_ai_request", { p_log: c.log_id, p_status: "success", p_delivered: parsed.delivered });
    return { ok: true, value: parsed.value, ctx };
  } catch {
    await supabase.rpc("finish_ai_request", { p_log: c.log_id, p_status: "failed", p_delivered: 0 });
    return { ok: false, error: FAILED };
  }
}

const explainSchema = z.object({
  topicId: z.string().uuid("Choose a topic."),
  question: z
    .string()
    .transform(cleanInput)
    .pipe(
      z
        .string()
        .min(AI_INPUT_LIMITS.questionMin, "Ask a question of at least a few words.")
        .max(AI_INPUT_LIMITS.questionMax, `Keep your question under ${AI_INPUT_LIMITS.questionMax} characters.`),
    ),
  level: z.enum(EXPLAIN_LEVELS),
});

export async function explainTopic(_prev: ExplainState, formData: FormData): Promise<ExplainState> {
  const parsed = explainSchema.safeParse({
    topicId: formData.get("topicId"),
    question: String(formData.get("question") ?? ""),
    level: formData.get("level") ?? "standard",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your question." };
  const { topicId, question, level } = parsed.data;
  const r = await runAi(
    "explanation",
    1,
    topicId,
    (ctx) => buildExplainPrompt(ctx, question, level),
    (raw) => {
      const e = parseExplanation(raw);
      return e.ok ? { value: e.value, delivered: 1 } : { value: null, delivered: 0 };
    },
  );
  if (!r.ok) return { error: r.error };
  return { result: { ...r.value, topic: r.ctx.topic, question } };
}

const practiceSchema = z.object({
  topicId: z.string().uuid("Choose a topic."),
  difficulty: z.enum(DIFFICULTIES),
  count: z.coerce.number().int().refine((n) => n === 5 || n === 10, "Choose 5 or 10 questions."),
});

export async function generatePractice(prev: PracticeState, formData: FormData): Promise<PracticeState> {
  const parsed = practiceSchema.safeParse({
    topicId: formData.get("topicId"),
    difficulty: formData.get("difficulty") ?? "standard",
    count: formData.get("count") ?? 5,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your choices." };
  const { topicId, difficulty, count } = parsed.data;
  const r = await runAi(
    "questions",
    count,
    topicId,
    (ctx) => buildQuestionsPrompt(ctx, difficulty, count),
    (raw, ctx) => {
      const qs = parseQuestions(raw, ctx, difficulty, count);
      // Fewer than half usable means the reply wasn't good enough to show.
      return qs.length >= Math.ceil(count / 2) ? { value: qs, delivered: qs.length } : { value: null, delivered: qs.length };
    },
  );
  if (!r.ok) return { error: r.error };
  return { result: { topic: r.ctx.topic, questions: r.value, requestId: (prev.result?.requestId ?? 0) + 1 } };
}

const flashcardSchema = z.object({ topicId: z.string().uuid("Choose a topic.") });
const FLASHCARD_COUNT = 10;

export async function generateFlashcards(_prev: FlashcardState, formData: FormData): Promise<FlashcardState> {
  const parsed = flashcardSchema.safeParse({ topicId: formData.get("topicId") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Choose a topic." };
  const r = await runAi(
    "flashcards",
    FLASHCARD_COUNT,
    parsed.data.topicId,
    (ctx) => buildFlashcardsPrompt(ctx, FLASHCARD_COUNT),
    (raw) => {
      const { cards } = parseFlashcards(raw, FLASHCARD_COUNT);
      return cards.length >= 3 ? { value: cards, delivered: cards.length } : { value: null, delivered: cards.length };
    },
  );
  if (!r.ok) return { error: r.error };

  // Saved as the student's own deck (RLS: owner only), labelled as AI-made.
  const supabase = await getServerSupabase();
  const { data: topicRow } = await supabase.from("topics").select("subject_id").eq("id", parsed.data.topicId).maybeSingle();
  const title = `${r.ctx.topic} (AI)`.slice(0, 80);
  const { data: deck, error } = await supabase
    .from("flashcard_decks")
    .insert({
      title,
      subject_id: (topicRow as { subject_id: string } | null)?.subject_id ?? null,
      topic_id: parsed.data.topicId,
      is_ai_generated: true,
    })
    .select("id")
    .single();
  if (error || !deck) return { error: "We couldn't save the deck. Try again." };
  const deckId = (deck as { id: string }).id;
  const { error: cardError } = await supabase
    .from("flashcards")
    .insert(r.value.map((c, i) => ({ deck_id: deckId, front: c.front, back: c.back, sort_order: i })));
  if (cardError) return { error: "We couldn't save the cards. Try again." };
  redirect(`/flashcards/${deckId}?ai=1`);
}
