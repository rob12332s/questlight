import type { Lesson } from "@/domain/lesson";
import { ENGLISH_LANGUAGE_LESSONS, ENGLISH_LITERATURE_LESSONS } from "./english";
import { GEOGRAPHY_LESSONS, HISTORY_LESSONS } from "./humanities";
import { MATHS_LESSONS } from "./maths";
import { BIOLOGY_LESSONS, CHEMISTRY_LESSONS, PHYSICS_LESSONS } from "./sciences";

/**
 * Published Exam Answer Coach lessons, by subject and library topic slug.
 * Written and checked for Questlight; questions are original, not taken from exam papers.
 */
export const LESSONS: Record<string, Record<string, Lesson>> = {
  maths: MATHS_LESSONS,
  biology: BIOLOGY_LESSONS,
  chemistry: CHEMISTRY_LESSONS,
  physics: PHYSICS_LESSONS,
  "english-language": ENGLISH_LANGUAGE_LESSONS,
  "english-literature": ENGLISH_LITERATURE_LESSONS,
  history: HISTORY_LESSONS,
  geography: GEOGRAPHY_LESSONS,
};

export function lessonCount(): number {
  return Object.values(LESSONS).reduce((n, s) => n + Object.keys(s).length, 0);
}
