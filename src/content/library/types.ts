/**
 * Authoring format for the GCSE library catalogue.
 *
 * The catalogue lists what a GCSE student needs to learn, organised by main topic
 * (area) and subtopic. Each entry is one learnable objective. Lessons for the
 * Exam Answer Coach live separately in src/content/lessons and are attached by slug.
 *
 * Labels are honest by design:
 *   coverage      shared          content the DfE GCSE subject content requires of every board
 *                 general         sound GCSE content not yet mapped line by line to a board
 *                 board_specific  belongs only to the listed boards (set texts, history options…)
 *   verification  verified        checked against the published specification
 *                 awaiting_verification  not yet checked line by line by a person
 *
 * Never tag a board unless the topic genuinely belongs to that board's specification.
 * scripts/build-library.ts turns this into a SQL migration; tests/unit/library.test.ts
 * validates it (unique slugs, no duplicate titles or objectives, 100+ entries per subject).
 */
import type { SubjectSlug } from "@/config/subjects";

export type Coverage = "shared" | "general" | "board_specific";
export type Verification = "verified" | "awaiting_verification";
export type Tier = "all" | "foundation" | "higher";
export type LibraryDifficulty = "foundation" | "standard" | "challenge";
export type BoardId = "aqa" | "edexcel" | "ocr";

/** Skills are a fixed vocabulary so the Exam Map can track technique across subjects. */
export const SKILLS = {
  recall: "Recall and define",
  calc: "Calculate",
  algebra: "Manipulate algebra",
  graph: "Draw and read graphs",
  geometry: "Reason with shape and space",
  problem: "Solve multi-step problems",
  proof: "Reason and prove",
  reason: "Reason mathematically",
  data: "Interpret data",
  explain: "Explain a process",
  apply: "Apply knowledge to a new context",
  practical: "Plan and evaluate practicals",
  analyse: "Analyse language and structure",
  context: "Link text to context",
  compare: "Compare texts or viewpoints",
  evaluate: "Evaluate and judge",
  write: "Write for purpose and audience",
  accuracy: "Write accurately (SPaG)",
  source: "Analyse sources",
  interpretation: "Analyse interpretations",
  narrative: "Write an account",
  change: "Explain change and continuity",
  cause: "Explain causes and consequences",
  map: "Use maps and geographical skills",
  case_study: "Use case-study evidence",
  fieldwork: "Fieldwork and enquiry",
} as const;
export type SkillId = keyof typeof SKILLS;

export interface TopicFlags {
  /** Tier: "f" foundation only, "h" higher only. Default: all tiers. */
  t?: "f" | "h";
  /** Difficulty: "f" foundation, "c" challenge. Default: standard. */
  d?: "f" | "c";
  /** Paper, when the paper is genuinely known for the listed boards. */
  p?: string;
  coverage?: Coverage;
  verification?: Verification;
  boards?: BoardId[];
  /** Set text or history option this topic belongs to. */
  opt?: string;
  /** Separate science only (not in Combined Science). */
  sep?: true;
  /** Force access. By default the first topic of each subtopic group is free. */
  access?: "free" | "pro";
  /** Linked quiz topic as "subject/slug" from the question bank. */
  quiz?: string;
}

/** [slug, title, objective, skill, flags?] */
export type TopicTuple = [string, string, string, SkillId, TopicFlags?];

export interface LibraryGroup {
  subtopic: string;
  /** Flags applied to every topic in the group (topic flags win). */
  flags?: TopicFlags;
  topics: TopicTuple[];
}

export interface LibraryArea {
  area: string;
  flags?: TopicFlags;
  groups: LibraryGroup[];
}

export interface SubjectLibrary {
  subject: SubjectSlug;
  /** Subject-wide defaults (area, group and topic flags win). */
  defaults: { coverage: Coverage; verification: Verification } & TopicFlags;
  areas: LibraryArea[];
}

/** One option a student can choose (a set text, a history unit…). */
export interface CourseOption {
  key: string;
  name: string;
  group: string;
  boards: BoardId[];
}

export interface LibraryEntry {
  subject: SubjectSlug;
  slug: string;
  area: string;
  subtopic: string;
  title: string;
  objective: string;
  skill: SkillId;
  tier: Tier;
  difficulty: LibraryDifficulty;
  paper: string | null;
  coverage: Coverage;
  verification: Verification;
  boards: BoardId[];
  access: "free" | "pro";
  qualification: "all" | "separate_only";
  optionKey: string | null;
  quiz: string | null;
  sortOrder: number;
}

const TIERS = { f: "foundation", h: "higher" } as const;
const DIFFS = { f: "foundation", c: "challenge" } as const;

/** Flattens a subject library into entries, applying defaults and the free-topic rule. */
export function flattenLibrary(lib: SubjectLibrary): LibraryEntry[] {
  const out: LibraryEntry[] = [];
  let order = 0;
  for (const area of lib.areas) {
    for (const group of area.groups) {
      group.topics.forEach(([slug, title, objective, skill, own], i) => {
        const f: TopicFlags = { ...lib.defaults, ...area.flags, ...group.flags, ...own };
        const coverage = f.coverage ?? lib.defaults.coverage;
        out.push({
          subject: lib.subject,
          slug,
          area: area.area,
          subtopic: group.subtopic,
          title,
          objective,
          skill,
          tier: f.t ? TIERS[f.t] : "all",
          difficulty: f.d ? DIFFS[f.d] : "standard",
          paper: f.p ?? null,
          coverage,
          verification: f.verification ?? lib.defaults.verification,
          boards: coverage === "board_specific" ? [...(f.boards ?? [])] : [],
          access: own?.access ?? (i === 0 ? "free" : "pro"),
          qualification: f.sep ? "separate_only" : "all",
          optionKey: f.opt ?? null,
          quiz: f.quiz ?? null,
          sortOrder: order++,
        });
      });
    }
  }
  return out;
}
