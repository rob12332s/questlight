/**
 * Offensive display-name filter. Display names are seen by other students (live games,
 * leaderboards), so clearly offensive ones are refused.
 *
 * Mirrors public.is_acceptable_display_name() in supabase/migrations/…_leaderboards.sql,
 * which is the authority. A unit test checks that both term lists match, and both test
 * suites run the same sample names.
 *
 * How it matches, so that ordinary names aren't caught (the "Scunthorpe problem"):
 *   - Names are lower-cased and common digit swaps are undone (0→o, 1→i, 3→e, 4→a,
 *     5→s, 7→t, 8→b). Terms are checked against the name as written and with repeated
 *     letters collapsed ("fuuuck" → "fuck").
 *   - ANYWHERE terms are long or unambiguous, and are found inside the name with spaces
 *     and punctuation removed ("f.u.c.k", "BigFuckFan").
 *   - WORD terms are short or appear inside innocent words ("Hancock", "Dickens",
 *     "Arsenal", "Sexton"), so they only match a whole word. Words are split at spaces,
 *     punctuation and camelCase ("BigDick" → "big", "dick").
 * It is a floor, not a guarantee: content reports remain the backstop.
 */

export const ANYWHERE_TERMS = [
  "fuck",
  "cunt",
  "nigger",
  "nigga",
  "faggot",
  "wanker",
  "wank",
  "twat",
  "bitch",
  "shit",
  "slut",
  "whore",
  "retard",
  "rapist",
  "paedo",
  "hitler",
  "nazi",
  "porn",
  "penis",
  "vagina",
  "dildo",
  "bastard",
  "bollock",
  "spastic",
  "jizz",
  "killyourself",
  "motherfucker",
] as const;

export const WORD_TERMS = [
  "ass",
  "arse",
  "arsehole",
  "asshole",
  "anal",
  "boob",
  "boobs",
  "cock",
  "coon",
  "cum",
  "dick",
  "dyke",
  "fag",
  "homo",
  "kike",
  "knob",
  "kys",
  "nonce",
  "paki",
  "pedo",
  "piss",
  "prick",
  "rape",
  "sex",
  "spaz",
  "tit",
  "tits",
  "tranny",
] as const;

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b" };

/** Lower-case and undo digit swaps. */
export function leetLower(text: string): string {
  return text.toLowerCase().replace(/[0134578]/g, (d) => LEET[d] ?? d);
}

/** Collapse runs of the same character ("fuuuck" → "fuck"). Terms themselves are never collapsed. */
export function collapseRepeats(text: string): string {
  return text.replace(/(.)\1+/g, "$1");
}

const WORDS = new Set<string>(WORD_TERMS);

/**
 * A term is matched against the name as written and against its collapsed form. A term
 * with a double letter can only match as written, so "boob" never blocks "Bob".
 */
export function isAcceptableDisplayName(name: string): boolean {
  const raw = leetLower(name.replace(/[\s_.-]+/g, ""));
  const collapsed = collapseRepeats(raw);
  if (ANYWHERE_TERMS.some((term) => raw.includes(term) || collapsed.includes(term))) return false;
  const words = name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[\s_.-]+/)
    .filter(Boolean)
    .map(leetLower);
  if (words.some((w) => WORDS.has(w) || WORDS.has(collapseRepeats(w)))) return false;
  // Letters spaced out to dodge the word list ("d i c k").
  if (WORDS.has(raw) || WORDS.has(collapsed)) return false;
  return true;
}

/** Sample names used by both the unit tests and the database tests. */
export const FILTER_SAMPLES: ReadonlyArray<readonly [string, boolean]> = [
  ["Rob", true],
  ["Hancock", true],
  ["Dickens Fan", true],
  ["Arsenal 4ever", true],
  ["Sexton", true],
  ["Scrabble Queen", true],
  ["Pedro", true],
  ["Cockburn", true],
  ["Grass Hopper", true],
  ["Title Winner", true],
  ["Analise", true],
  ["Shitake Sam", false],
  ["f.u.c.k", false],
  ["Fuuuck", false],
  ["BigDick", false],
  ["big_dick_99", false],
  ["5h1t", false],
  ["d i c k", false],
  ["Kys", false],
  ["MrWanker", false],
  ["N1gg4", false],
  ["Hitler Fan", false],
  ["Bob", true],
  ["Nigeria Fan", true],
  ["Glass Act", true],
  ["Cassie", true],
  ["Massive Brain", true],
  ["Ass", false],
  ["Assss", true],
];
