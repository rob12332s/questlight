/**
 * Mastery for the Exam Map.
 *
 * Mastery comes only from independent work (exam-style questions answered without hints,
 * or retests). Worked examples and guided practice show a topic is being learned but never
 * count towards mastery, and one quick correct answer is never enough:
 *
 *   Not started      no attempts
 *   Learning         attempted, but no independent attempt at 60% or more yet
 *   Developing       an independent attempt at 60%+
 *   Nearly mastered  an independent attempt at 80%+ that isn't yet confirmed
 *   Mastered         two independent attempts at 80%+, at least 3 days apart, worth at least
 *                    8 marks between them, and the latest independent attempt is still 80%+
 *
 * A Nearly mastered or Mastered topic is "due a retest" 21 days after the last independent
 * success. The Exam Map never predicts grades.
 */
export type MasteryLevel = "not_started" | "learning" | "developing" | "nearly_mastered" | "mastered";

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  not_started: "Not started",
  learning: "Learning",
  developing: "Developing",
  nearly_mastered: "Nearly mastered",
  mastered: "Mastered",
};

export const MASTERY_RULES = {
  developingPct: 0.6,
  masteryPct: 0.8,
  retestGapDays: 3,
  minMasteryMarks: 8,
  retestAfterDays: 21,
  recentWindow: 5,
} as const;

export type CoachMode = "worked" | "guided" | "independent" | "retest";

export interface Attempt {
  topicId: string;
  mode: CoachMode;
  marksAwarded: number;
  marksAvailable: number;
  /** Epoch milliseconds. */
  at: number;
  mistakes: string[];
}

export interface TopicMastery {
  topicId: string;
  level: MasteryLevel;
  attempts: number;
  independentAttempts: number;
  /** Share of marks over the last few independent attempts, or null if none. */
  recentAccuracy: number | null;
  lastMarks: { awarded: number; available: number } | null;
  lastAt: number | null;
  improving: boolean;
  dueRetest: boolean;
  needsAnotherAttempt: boolean;
  /** Plain-English reason for the level, shown to the student. */
  reason: string;
}

const DAY = 86_400_000;
const pct = (a: { marksAwarded: number; marksAvailable: number }) => a.marksAwarded / a.marksAvailable;
const independent = (a: Attempt) => a.mode === "independent" || a.mode === "retest";

export function topicMastery(topicId: string, all: Attempt[], now: number): TopicMastery {
  const attempts = all.filter((a) => a.topicId === topicId).sort((a, b) => a.at - b.at);
  const ind = attempts.filter(independent);
  const last = ind.at(-1) ?? null;
  const recent = ind.slice(-MASTERY_RULES.recentWindow);
  const recentAccuracy = recent.length
    ? recent.reduce((s, a) => s + a.marksAwarded, 0) / recent.reduce((s, a) => s + a.marksAvailable, 0)
    : null;

  const base = {
    topicId,
    attempts: attempts.length,
    independentAttempts: ind.length,
    recentAccuracy,
    lastMarks: last ? { awarded: last.marksAwarded, available: last.marksAvailable } : null,
    lastAt: attempts.at(-1)?.at ?? null,
  };

  if (attempts.length === 0) {
    return { ...base, level: "not_started", improving: false, dueRetest: false, needsAnotherAttempt: false, reason: "You haven't tried this topic yet." };
  }

  // Improving: latest independent score is clearly above the first one.
  const improving = ind.length >= 2 && pct(ind.at(-1)!) - pct(ind[0]) >= 0.15;
  const needsAnotherAttempt = last !== null && pct(last) < MASTERY_RULES.developingPct;

  if (!last) {
    return {
      ...base,
      level: "learning",
      improving,
      dueRetest: false,
      needsAnotherAttempt: false,
      reason: "You've worked through it with support. Try the exam questions on your own next.",
    };
  }

  const successes = ind.filter((a) => pct(a) >= MASTERY_RULES.masteryPct);
  const lastStrong = pct(last) >= MASTERY_RULES.masteryPct;
  const lastSuccessAt = successes.at(-1)?.at ?? null;

  let confirmed = false;
  if (lastStrong && successes.length >= 2) {
    const first = successes[0];
    const latest = successes.at(-1)!;
    const marks = successes.reduce((s, a) => s + a.marksAvailable, 0);
    confirmed = latest.at - first.at >= MASTERY_RULES.retestGapDays * DAY && marks >= MASTERY_RULES.minMasteryMarks;
  }

  const dueRetest = lastStrong && lastSuccessAt !== null && now - lastSuccessAt >= MASTERY_RULES.retestAfterDays * DAY;
  const score = `${last.marksAwarded}/${last.marksAvailable}`;

  if (confirmed) {
    return {
      ...base,
      level: "mastered",
      improving,
      dueRetest,
      needsAnotherAttempt,
      reason: dueRetest
        ? `Mastered, but it's been ${Math.floor((now - lastSuccessAt!) / DAY)} days — a quick retest will keep it secure.`
        : `You've scored 80%+ on your own on separate days (latest ${score}).`,
    };
  }
  if (lastStrong) {
    return {
      ...base,
      level: "nearly_mastered",
      improving,
      dueRetest,
      needsAnotherAttempt,
      reason: `You scored ${score} on your own. Score 80%+ again in a few days to confirm it's mastered.`,
    };
  }
  if (pct(last) >= MASTERY_RULES.developingPct) {
    return { ...base, level: "developing", improving, dueRetest: false, needsAnotherAttempt, reason: `You scored ${score} on your own. Aim for 80% to move up.` };
  }
  return {
    ...base,
    level: "learning",
    improving,
    dueRetest: false,
    needsAnotherAttempt,
    reason: `You scored ${score} on your own last time. Practise with hints, then try again.`,
  };
}

export interface MapTopic {
  id: string;
  title: string;
  subject: string;
  skill: string;
}

export interface Recommendation {
  topicId: string;
  action: "practise" | "retest" | "test" | "start" | "fix_mistake";
  mode: CoachMode | "learn";
  reason: string;
  priority: number;
}

/** Ordered next actions, each with the reason it was chosen. */
export function recommendNext(topics: MapTopic[], mastery: Map<string, TopicMastery>, recurring: { label: string; fix: string; count: number }[], limit = 5): Recommendation[] {
  const recs: Recommendation[] = [];
  for (const t of topics) {
    const m = mastery.get(t.id);
    if (!m || m.level === "not_started") continue;
    if (m.needsAnotherAttempt && m.lastMarks) {
      recs.push({ topicId: t.id, action: "practise", mode: "guided", priority: 100 - Math.round((m.recentAccuracy ?? 0) * 50), reason: `You scored ${m.lastMarks.awarded}/${m.lastMarks.available} on ${t.title}. Practise with hints, then retry.` });
    } else if (m.dueRetest) {
      recs.push({ topicId: t.id, action: "retest", mode: "retest", priority: 80, reason: `It's been a while since you secured ${t.title}. A retest keeps it in long-term memory.` });
    } else if (m.level === "nearly_mastered") {
      recs.push({ topicId: t.id, action: "retest", mode: "retest", priority: 70, reason: `One more strong independent score on ${t.title} confirms it as mastered.` });
    } else if (m.level === "learning" && m.independentAttempts === 0) {
      recs.push({ topicId: t.id, action: "test", mode: "independent", priority: 60, reason: `You've learned ${t.title} with support. Test yourself without hints.` });
    } else if (m.level === "developing") {
      recs.push({ topicId: t.id, action: "practise", mode: "independent", priority: 50, reason: `You're close on ${t.title}. Another exam-style attempt can take it to 80%.` });
    }
  }
  const started = new Set([...mastery.values()].filter((m) => m.level !== "not_started").map((m) => m.topicId));
  const next = topics.find((t) => !started.has(t.id));
  if (next) recs.push({ topicId: next.id, action: "start", mode: "learn", priority: 30, reason: `Start something new: ${next.title} is next in your course.` });
  recs.sort((a, b) => b.priority - a.priority);
  const out = recs.slice(0, limit);
  if (recurring[0] && out.length > 0) {
    // Attach the most common mistake to the top recommendation as an extra reason.
    out[0] = { ...out[0], reason: `${out[0].reason} Watch out for: ${recurring[0].label.toLowerCase()} (${recurring[0].count} times recently).` };
  }
  return out;
}

/** Share of independent marks per ISO week (Monday start), oldest first. */
export function accuracyByWeek(attempts: Attempt[], weeks: number, now: number): { weekStart: number; accuracy: number | null; marks: number }[] {
  const startOfWeek = (t: number) => {
    const d = new Date(t);
    const day = (d.getUTCDay() + 6) % 7;
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day);
  };
  const thisWeek = startOfWeek(now);
  const out = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const ws = thisWeek - i * 7 * DAY;
    const inWeek = attempts.filter((a) => independent(a) && a.at >= ws && a.at < ws + 7 * DAY);
    const avail = inWeek.reduce((s, a) => s + a.marksAvailable, 0);
    out.push({ weekStart: ws, accuracy: avail ? inWeek.reduce((s, a) => s + a.marksAwarded, 0) / avail : null, marks: avail });
  }
  return out;
}

/** Independent accuracy per skill (technique), for skills with at least `min` marks attempted. */
export function accuracyBySkill(attempts: Attempt[], skillOf: Map<string, string>, min = 4): { skill: string; accuracy: number; marks: number }[] {
  const totals = new Map<string, { got: number; avail: number }>();
  for (const a of attempts) {
    if (!independent(a)) continue;
    const skill = skillOf.get(a.topicId);
    if (!skill) continue;
    const t = totals.get(skill) ?? { got: 0, avail: 0 };
    t.got += a.marksAwarded;
    t.avail += a.marksAvailable;
    totals.set(skill, t);
  }
  return [...totals.entries()]
    .filter(([, t]) => t.avail >= min)
    .map(([skill, t]) => ({ skill, accuracy: t.got / t.avail, marks: t.avail }))
    .sort((a, b) => a.accuracy - b.accuracy);
}
