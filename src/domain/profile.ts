/**
 * Display-name rules. Mirrors public.is_valid_display_name() in the database, which
 * is the authority; this copy lets forms explain problems before submitting.
 */
export const DISPLAY_NAME_RULES = {
  min: 3,
  max: 24,
  pattern: /^[A-Za-z0-9][A-Za-z0-9 _.-]{1,22}[A-Za-z0-9]$/,
} as const;

export type DisplayNameProblem = "too_short" | "too_long" | "bad_characters" | "bad_edges" | "double_space";

export function displayNameProblem(raw: string): DisplayNameProblem | null {
  const name = raw.trim();
  if (name.length < DISPLAY_NAME_RULES.min) return "too_short";
  if (name.length > DISPLAY_NAME_RULES.max) return "too_long";
  if (/[^A-Za-z0-9 _.-]/.test(name)) return "bad_characters";
  if (/\s{2,}/.test(name)) return "double_space";
  if (!DISPLAY_NAME_RULES.pattern.test(name)) return "bad_edges";
  return null;
}

export const DISPLAY_NAME_MESSAGES: Record<DisplayNameProblem, string> = {
  too_short: "Use at least 3 characters.",
  too_long: "Use 24 characters or fewer.",
  bad_characters: "Use letters, numbers, spaces, dots, dashes or underscores.",
  bad_edges: "Start and end with a letter or number.",
  double_space: "Use single spaces only.",
};
