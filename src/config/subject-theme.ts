import type { CSSProperties } from "react";
import type { SubjectSlug } from "./subjects";

/**
 * A colour for each subject, so subjects are recognisable at a glance across the app.
 * "dark" is used on the dark theme and "light" (deeper, for contrast) on the light theme.
 */
const SUBJECT_COLOURS: Record<SubjectSlug, { dark: string; light: string }> = {
  maths: { dark: "#8b95ff", light: "#4a52d1" },
  "english-language": { dark: "#f4a261", light: "#b4581a" },
  "english-literature": { dark: "#f07fae", light: "#b8336c" },
  biology: { dark: "#5fd08f", light: "#1f8048" },
  chemistry: { dark: "#4fd1e0", light: "#0e7d8a" },
  physics: { dark: "#b69cff", light: "#6a45d6" },
  "combined-science": { dark: "#a7d86a", light: "#4f7d17" },
  history: { dark: "#e8be5c", light: "#8f6408" },
  geography: { dark: "#62b2ff", light: "#1f69b8" },
};

/** Inline style that feeds the .subject-* classes in globals.css. */
export function subjectStyle(slug: string): CSSProperties {
  const c = SUBJECT_COLOURS[slug as SubjectSlug] ?? { dark: "#8b95ff", light: "#4a52d1" };
  return { "--s-dark": c.dark, "--s-light": c.light } as CSSProperties;
}
