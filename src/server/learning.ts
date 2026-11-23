import "server-only";

import { cache } from "react";
import type { Difficulty } from "@/domain/types";
import { getServerSupabase } from "@/lib/supabase/server";

export interface TopicSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  questionCount: number;
  byDifficulty: Record<Difficulty, number>;
}

export interface SubjectWithTopics {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  topics: TopicSummary[];
}

export interface TopicProgress {
  topicId: string;
  questionsAttempted: number;
  correctAnswers: number;
  bestAccuracy: number | null;
  mastery: number;
  lastPractisedAt: string | null;
}

/** Minimum answers on a topic before we call it weak or strong. */
export const MIN_ANSWERS_FOR_RECOMMENDATION = 10;

/** GCSE subjects, their topics, and how many published questions each topic has. */
export const getCurriculum = cache(async (): Promise<SubjectWithTopics[]> => {
  const supabase = await getServerSupabase();
  const [subjectsRes, topicsRes, questionsRes] = await Promise.all([
    supabase.from("subjects").select("id, slug, name, description").order("sort_order"),
    supabase
      .from("topics")
      .select("id, subject_id, slug, name, description")
      .eq("education_stage", "gcse")
      .order("sort_order"),
    supabase.from("questions").select("topic_id, difficulty").eq("is_published", true),
  ]);

  const counts = new Map<string, Record<Difficulty, number>>();
  for (const q of (questionsRes.data ?? []) as Array<{ topic_id: string; difficulty: Difficulty }>) {
    const entry = counts.get(q.topic_id) ?? { foundation: 0, standard: 0, challenge: 0 };
    entry[q.difficulty] += 1;
    counts.set(q.topic_id, entry);
  }

  const topics = (topicsRes.data ?? []) as Array<{
    id: string;
    subject_id: string;
    slug: string;
    name: string;
    description: string | null;
  }>;

  return ((subjectsRes.data ?? []) as Array<{ id: string; slug: string; name: string; description: string | null }>).map(
    (subject) => ({
      ...subject,
      topics: topics
        .filter((t) => t.subject_id === subject.id)
        .map((t) => {
          const byDifficulty = counts.get(t.id) ?? { foundation: 0, standard: 0, challenge: 0 };
          return {
            id: t.id,
            slug: t.slug,
            name: t.name,
            description: t.description,
            byDifficulty,
            questionCount: byDifficulty.foundation + byDifficulty.standard + byDifficulty.challenge,
          };
        }),
    }),
  );
});

export const getTopicProgress = cache(async (userId: string): Promise<Map<string, TopicProgress>> => {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("user_progress")
    .select("topic_id, questions_attempted, correct_answers, best_accuracy, mastery, last_practised_at")
    .eq("player_id", userId);
  const map = new Map<string, TopicProgress>();
  for (const row of (data ?? []) as Array<{
    topic_id: string;
    questions_attempted: number;
    correct_answers: number;
    best_accuracy: number | string | null;
    mastery: number | string;
    last_practised_at: string | null;
  }>) {
    map.set(row.topic_id, {
      topicId: row.topic_id,
      questionsAttempted: row.questions_attempted,
      correctAnswers: row.correct_answers,
      bestAccuracy: row.best_accuracy === null ? null : Number(row.best_accuracy),
      mastery: Number(row.mastery),
      lastPractisedAt: row.last_practised_at,
    });
  }
  return map;
});

export interface RecentQuiz {
  id: string;
  topicName: string;
  subjectName: string;
  correct: number;
  total: number;
  xp: number;
  completedAt: string;
}

export async function getRecentQuizzes(userId: string, limit = 5): Promise<RecentQuiz[]> {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("quiz_sessions")
    .select("id, correct_count, question_ids, xp_awarded, completed_at, topics(name, subjects(name))")
    .eq("player_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as unknown as Array<{
    id: string;
    correct_count: number;
    question_ids: string[];
    xp_awarded: number;
    completed_at: string;
    topics: { name: string; subjects: { name: string } | null } | null;
  }>).map((row) => ({
    id: row.id,
    topicName: row.topics?.name ?? "Mixed topics",
    subjectName: row.topics?.subjects?.name ?? "",
    correct: row.correct_count,
    total: row.question_ids.length,
    xp: row.xp_awarded,
    completedAt: row.completed_at,
  }));
}

/** Calendar days (Europe/London) on which the student finished a quiz or reviewed cards. */
export async function getActivityDays(userId: string): Promise<string[]> {
  const supabase = await getServerSupabase();
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const [quizzes, reviews] = await Promise.all([
    supabase.from("quiz_sessions").select("completed_at").eq("player_id", userId).eq("status", "completed").gte("completed_at", since),
    supabase.from("flashcard_reviews").select("reviewed_at").eq("owner_id", userId).gte("reviewed_at", since),
  ]);
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" });
  const days = new Set<string>();
  for (const r of (quizzes.data ?? []) as Array<{ completed_at: string }>) days.add(fmt.format(new Date(r.completed_at)));
  for (const r of (reviews.data ?? []) as Array<{ reviewed_at: string }>) days.add(fmt.format(new Date(r.reviewed_at)));
  return [...days];
}

export function todayInLondon(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(),
  );
}
