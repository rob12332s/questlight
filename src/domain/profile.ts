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

/**
 * Catches common email typos before they reach the auth service, e.g. "gmail.con".
 * Returns a suggested correction, or null when nothing looks wrong.
 */
const DOMAIN_FIXES: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "icloud.co": "icloud.com",
  "iclod.com": "icloud.com",
  "outlook.co": "outlook.com",
};
const TLD_FIXES: Record<string, string> = { con: "com", cmo: "com", ocm: "com", vom: "com", xom: "com", couk: "co.uk" };

export function suggestEmailFix(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1).toLowerCase();
  if (DOMAIN_FIXES[domain]) return `${local}@${DOMAIN_FIXES[domain]}`;
  const dot = domain.lastIndexOf(".");
  const tld = domain.slice(dot + 1);
  if (dot > 0 && TLD_FIXES[tld]) return `${local}@${domain.slice(0, dot)}.${TLD_FIXES[tld]}`;
  return null;
}
