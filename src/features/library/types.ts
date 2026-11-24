import type { Board } from "@/config/boards";

/** Library data shapes shared by server code and client components. */
export interface LibraryTopic {
  id: string;
  subjectId: string;
  slug: string;
  area: string;
  subtopic: string | null;
  title: string;
  objective: string;
  skill: string;
  tier: "all" | "foundation" | "higher";
  difficulty: "foundation" | "standard" | "challenge";
  paper: string | null;
  coverage: "shared" | "general" | "board_specific";
  verification: "verified" | "awaiting_verification";
  boards: Board[];
  access: "free" | "pro";
  contentStatus: "lesson" | "practice" | "planned";
  qualification: "all" | "separate_only";
  optionKey: string | null;
  quizTopicId: string | null;
  sortOrder: number;
  isPublished: boolean;
}

export interface Subject {
  id: string;
  slug: string;
  name: string;
}

export interface Course {
  subjectId: string;
  board: Board | null;
  tier: "foundation" | "higher" | null;
  options: string[];
  confidence: number | null;
}

export interface Plan {
  pro: boolean;
  status: "active" | "pending" | "cancelled" | "expired" | "failed" | null;
  currentPeriodEnd: string | null;
  testMode: boolean;
  lessonsToday: number;
  freeLessonsPerDay: number;
}

