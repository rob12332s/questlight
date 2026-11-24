import { BIOLOGY_LIBRARY } from "./biology";
import { CHEMISTRY_LIBRARY } from "./chemistry";
import { ENGLISH_LANGUAGE_LIBRARY } from "./english-language";
import { ENGLISH_LITERATURE_LIBRARY } from "./english-literature";
import { GEOGRAPHY_LIBRARY } from "./geography";
import { HISTORY_LIBRARY } from "./history";
import { MATHS_LIBRARY } from "./maths";
import { PHYSICS_LIBRARY } from "./physics";
import { flattenLibrary, SKILLS, type CourseOption, type LibraryEntry, type SubjectLibrary } from "./types";

/**
 * Adding a subject (Computer Science, Business, RS, languages…) means writing one more
 * SubjectLibrary file, adding its subject row in a migration, and listing it here.
 */
export const LIBRARIES: SubjectLibrary[] = [
  MATHS_LIBRARY,
  ENGLISH_LANGUAGE_LIBRARY,
  ENGLISH_LITERATURE_LIBRARY,
  BIOLOGY_LIBRARY,
  CHEMISTRY_LIBRARY,
  PHYSICS_LIBRARY,
  HISTORY_LIBRARY,
  GEOGRAPHY_LIBRARY,
];

export const LIBRARY_ENTRIES: LibraryEntry[] = LIBRARIES.flatMap(flattenLibrary);

/** Set texts, history units and optional geography themes, derived from the catalogue. */
export function courseOptions(subject: string): CourseOption[] {
  const byKey = new Map<string, CourseOption>();
  for (const e of LIBRARY_ENTRIES) {
    if (e.subject !== subject || !e.optionKey) continue;
    const existing = byKey.get(e.optionKey);
    if (existing) {
      for (const b of e.boards) if (!existing.boards.includes(b)) existing.boards.push(b);
    } else {
      byKey.set(e.optionKey, { key: e.optionKey, name: e.subtopic, group: e.area, boards: [...e.boards] });
    }
  }
  return [...byKey.values()];
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Returns a list of problems; empty means the catalogue is valid. */
export function validateLibrary(entries: LibraryEntry[], quizTopics: Set<string>): string[] {
  const problems: string[] = [];
  const slugs = new Set<string>();
  const titles = new Set<string>();
  const objectives = new Set<string>();
  for (const e of entries) {
    const id = `${e.subject}/${e.slug}`;
    if (!SLUG.test(e.slug)) problems.push(`${id}: bad slug`);
    if (slugs.has(id)) problems.push(`${id}: duplicate slug`);
    slugs.add(id);
    const t = `${e.subject}/${norm(e.title)}`;
    if (titles.has(t)) problems.push(`${id}: duplicate title "${e.title}"`);
    titles.add(t);
    const o = norm(e.objective);
    if (objectives.has(o)) problems.push(`${id}: duplicate objective`);
    objectives.add(o);
    if (e.title.length < 2 || e.title.length > 120) problems.push(`${id}: title length`);
    if (e.objective.length < 10 || e.objective.length > 300) problems.push(`${id}: objective length`);
    if (e.area.length < 2 || e.area.length > 80) problems.push(`${id}: area length`);
    if (e.subtopic.length > 80) problems.push(`${id}: subtopic length`);
    if (e.paper && e.paper.length > 80) problems.push(`${id}: paper length`);
    if (!(e.skill in SKILLS)) problems.push(`${id}: unknown skill ${e.skill}`);
    if (e.coverage === "board_specific" && e.boards.length === 0) problems.push(`${id}: board-specific without a board`);
    if (e.coverage !== "board_specific" && e.boards.length > 0) problems.push(`${id}: boards on non-board-specific topic`);
    if (e.optionKey && !SLUG.test(e.optionKey)) problems.push(`${id}: bad option key`);
    if (e.quiz && !quizTopics.has(e.quiz)) problems.push(`${id}: unknown quiz topic ${e.quiz}`);
  }
  return problems;
}
