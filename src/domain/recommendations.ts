/**
 * What to study next, from measured results only. No recommendation is made for a
 * topic until the student has answered enough questions on it to be meaningful.
 */
export const RECOMMENDATION_RULES = {
  minAnswers: 10,
  weakAccuracy: 0.6,
  strongMastery: 0.85,
  revisitAfterDays: 7,
  max: 3,
} as const;

export interface TopicFacts {
  topicId: string;
  topicName: string;
  subjectName: string;
  questionsAttempted: number;
  correctAnswers: number;
  mastery: number;
  lastPractisedAt: Date | null;
}

export type RecommendationKind = "revisit_weak" | "return_after_gap" | "start_new" | "stretch";

export interface Recommendation {
  kind: RecommendationKind;
  topicId: string;
  topicName: string;
  subjectName: string;
  /** Plain-English reason, built from measured numbers. */
  reason: string;
  suggestedDifficulty: "foundation" | "standard" | "challenge" | null;
}

const PRIORITY: Record<RecommendationKind, number> = { revisit_weak: 0, return_after_gap: 1, start_new: 2, stretch: 3 };

export function recommendNext(
  practised: readonly TopicFacts[],
  untried: ReadonlyArray<Pick<TopicFacts, "topicId" | "topicName" | "subjectName">>,
  now: Date = new Date(),
): Recommendation[] {
  const out: Recommendation[] = [];
  const dayMs = 24 * 60 * 60 * 1000;

  for (const t of practised) {
    if (t.questionsAttempted < RECOMMENDATION_RULES.minAnswers) continue;
    const accuracy = t.correctAnswers / t.questionsAttempted;
    const pct = Math.round(accuracy * 100);
    const daysAgo = t.lastPractisedAt ? Math.floor((now.getTime() - t.lastPractisedAt.getTime()) / dayMs) : null;

    if (accuracy < RECOMMENDATION_RULES.weakAccuracy) {
      out.push({
        kind: "revisit_weak",
        topicId: t.topicId,
        topicName: t.topicName,
        subjectName: t.subjectName,
        reason: `${pct}% correct over ${t.questionsAttempted} answers. Read the explanations, then try Foundation questions.`,
        suggestedDifficulty: "foundation",
      });
    } else if (daysAgo !== null && daysAgo >= RECOMMENDATION_RULES.revisitAfterDays && t.mastery < RECOMMENDATION_RULES.strongMastery) {
      out.push({
        kind: "return_after_gap",
        topicId: t.topicId,
        topicName: t.topicName,
        subjectName: t.subjectName,
        reason: `Last practised ${daysAgo} days ago. A short quiz now helps it stick.`,
        suggestedDifficulty: "standard",
      });
    } else if (t.mastery >= RECOMMENDATION_RULES.strongMastery) {
      out.push({
        kind: "stretch",
        topicId: t.topicId,
        topicName: t.topicName,
        subjectName: t.subjectName,
        reason: `${Math.round(t.mastery * 100)}% on your recent answers. Ready for Challenge questions.`,
        suggestedDifficulty: "challenge",
      });
    }
  }

  for (const t of untried) {
    out.push({ kind: "start_new", ...t, reason: "Not started yet. A first quiz shows where you are.", suggestedDifficulty: null });
  }

  return out
    .sort((a, b) => PRIORITY[a.kind] - PRIORITY[b.kind])
    .slice(0, RECOMMENDATION_RULES.max);
}
