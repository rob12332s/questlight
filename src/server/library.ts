import "server-only";

import { cache } from "react";
import type { Board } from "@/config/boards";
import type { Attempt, CoachMode } from "@/domain/mastery";
import type { Course, LibraryTopic, Plan, Subject } from "@/features/library/types";
import { getServerSupabase } from "@/lib/supabase/server";

export type { Course, LibraryTopic, Plan, Subject } from "@/features/library/types";

const TOPIC_COLUMNS =
  "id, subject_id, slug, area, subtopic, title, objective, skill, tier, difficulty, paper, coverage, verification, boards, access, content_status, qualification, option_key, quiz_topic_id, sort_order, is_published";

type TopicRow = {
  id: string;
  subject_id: string;
  slug: string;
  area: string;
  subtopic: string | null;
  title: string;
  objective: string;
  skill: string;
  tier: LibraryTopic["tier"];
  difficulty: LibraryTopic["difficulty"];
  paper: string | null;
  coverage: LibraryTopic["coverage"];
  verification: LibraryTopic["verification"];
  boards: Board[];
  access: LibraryTopic["access"];
  content_status: LibraryTopic["contentStatus"];
  qualification: LibraryTopic["qualification"];
  option_key: string | null;
  quiz_topic_id: string | null;
  sort_order: number;
  is_published: boolean;
};

function toTopic(r: TopicRow): LibraryTopic {
  return {
    id: r.id,
    subjectId: r.subject_id,
    slug: r.slug,
    area: r.area,
    subtopic: r.subtopic,
    title: r.title,
    objective: r.objective,
    skill: r.skill,
    tier: r.tier,
    difficulty: r.difficulty,
    paper: r.paper,
    coverage: r.coverage,
    verification: r.verification,
    boards: r.boards ?? [],
    access: r.access,
    contentStatus: r.content_status,
    qualification: r.qualification,
    optionKey: r.option_key,
    quizTopicId: r.quiz_topic_id,
    sortOrder: r.sort_order,
    isPublished: r.is_published,
  };
}

export const getSubjects = cache(async (): Promise<Subject[]> => {
  const supabase = await getServerSupabase();
  const { data } = await supabase.from("subjects").select("id, slug, name").eq("is_active", true).order("sort_order");
  return (data ?? []) as Subject[];
});

/** Every published library topic (about 850 rows), ordered. Cached per request. */
export const getLibrary = cache(async (): Promise<LibraryTopic[]> => {
  const supabase = await getServerSupabase();
  // PostgREST caps responses at 1000 rows by default, so page through.
  const out: LibraryTopic[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("library_topics")
      .select(TOPIC_COLUMNS)
      .order("sort_order")
      .order("id")
      .range(from, from + 999);
    if (error || !data) break;
    out.push(...(data as TopicRow[]).map(toTopic));
    if (data.length < 1000) break;
  }
  return out;
});

export async function getTopicBySlug(subjectId: string, slug: string): Promise<LibraryTopic | null> {
  const supabase = await getServerSupabase();
  const { data } = await supabase.from("library_topics").select(TOPIC_COLUMNS).eq("subject_id", subjectId).eq("slug", slug).maybeSingle();
  return data ? toTopic(data as TopicRow) : null;
}

export async function getTopicById(id: string): Promise<LibraryTopic | null> {
  const supabase = await getServerSupabase();
  const { data } = await supabase.from("library_topics").select(TOPIC_COLUMNS).eq("id", id).maybeSingle();
  return data ? toTopic(data as TopicRow) : null;
}

export const getCourses = cache(async (userId: string): Promise<Map<string, Course>> => {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("profile_subjects")
    .select("subject_id, exam_board, tier, options, confidence")
    .eq("profile_id", userId);
  const rows = (data ?? []) as Array<{ subject_id: string; exam_board: Board | null; tier: Course["tier"]; options: string[] | null; confidence: number | null }>;
  return new Map(rows.map((r) => [r.subject_id, { subjectId: r.subject_id, board: r.exam_board, tier: r.tier, options: r.options ?? [], confidence: r.confidence }]));
});

export const getPlan = cache(async (): Promise<Plan> => {
  const supabase = await getServerSupabase();
  const { data } = await supabase.rpc("my_plan");
  const p = (data ?? {}) as Record<string, unknown>;
  return {
    pro: p.pro === true,
    status: (p.status as Plan["status"]) ?? null,
    currentPeriodEnd: (p.current_period_end as string | null) ?? null,
    testMode: p.test_mode === true,
    lessonsToday: Number(p.lessons_today ?? 0),
    freeLessonsPerDay: Number(p.free_lessons_per_day ?? 5),
  };
});

export const getIsContentAdmin = cache(async (): Promise<boolean> => {
  const supabase = await getServerSupabase();
  const { data } = await supabase.rpc("is_content_admin");
  return data === true;
});

export const getCoachAttempts = cache(async (userId: string): Promise<Attempt[]> => {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("coach_attempts")
    .select("topic_id, mode, marks_awarded, marks_available, mistakes, created_at")
    .eq("player_id", userId)
    .order("created_at", { ascending: true })
    .limit(2000);
  return ((data ?? []) as Array<{ topic_id: string; mode: CoachMode; marks_awarded: number; marks_available: number; mistakes: string[]; created_at: string }>).map((r) => ({
    topicId: r.topic_id,
    mode: r.mode,
    marksAwarded: r.marks_awarded,
    marksAvailable: r.marks_available,
    mistakes: r.mistakes ?? [],
    at: Date.parse(r.created_at),
  }));
});

/**
 * Whether a topic belongs in this student's view of the library, given their course.
 * With no course details set, everything is shown.
 */
export function inCourse(t: LibraryTopic, course: Course | undefined): boolean {
  if (!course) return true;
  if (course.tier === "foundation" && t.tier === "higher") return false;
  if (course.tier === "higher" && t.tier === "foundation") return false;
  if (course.board && t.coverage === "board_specific" && !t.boards.includes(course.board)) return false;
  if (t.optionKey && course.options.length > 0 && !course.options.includes(t.optionKey)) return false;
  return true;
}
