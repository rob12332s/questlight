/**
 * Plans and the Pro price. This is the ONLY place the price is written in code: every
 * page reads it from here. Limits are enforced in the database (free_lessons_per_day()
 * and ai_limits() in the migrations); unit tests check those numbers match this file.
 *
 * Payments are not live. No payment provider is connected, and paid plans for students
 * under 18 need a parent or guardian to complete checkout. Until a provider is connected
 * and that flow has been reviewed by the site owner, Pro can only be granted by the
 * owner in the database, or simulated in test environments (see SETUP.md).
 */
export const PRO_PRICE = { amountPence: 500, currency: "GBP", interval: "month" } as const;

export const PAYMENTS_LIVE = false as const;

export function formatProPrice(style: "short" | "long" = "short"): string {
  const amount = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: PRO_PRICE.currency,
    minimumFractionDigits: PRO_PRICE.amountPence % 100 === 0 ? 0 : 2,
  }).format(PRO_PRICE.amountPence / 100);
  return style === "short" ? `${amount}/${PRO_PRICE.interval}` : `${amount} a ${PRO_PRICE.interval}`;
}

export const PLAN_IDS = ["free", "pro"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export interface PlanLimits {
  /** Exam Answer Coach lessons a student can open per day (null = unlimited). */
  coachLessonsPerDay: number | null;
  /** Whether Pro-only library topics are open. */
  allTopics: boolean;
  aiExplanationsPerDay: number;
  /** AI-generated practice questions per rolling 24 hours. */
  aiQuestionsPerDay: number;
  /** AI flashcard generation requests per rolling 24 hours. */
  aiFlashcardRequestsPerDay: number;
  /** Max questions in a single AI generation request. */
  aiMaxQuestionsPerRequest: number;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    coachLessonsPerDay: 5,
    allTopics: false,
    aiExplanationsPerDay: 20,
    aiQuestionsPerDay: 30,
    aiFlashcardRequestsPerDay: 5,
    aiMaxQuestionsPerRequest: 10,
  },
  pro: {
    coachLessonsPerDay: null,
    allTopics: true,
    aiExplanationsPerDay: 100,
    aiQuestionsPerDay: 150,
    aiFlashcardRequestsPerDay: 25,
    aiMaxQuestionsPerRequest: 10,
  },
};

export function getPlanLimits(plan: PlanId | null | undefined): PlanLimits {
  return PLAN_LIMITS[plan === "pro" ? "pro" : "free"];
}

/** Free vs Pro, as shown in the upgrade modal and on the Pro page. */
export const PLAN_COMPARISON: { feature: string; free: string; pro: string }[] = [
  { feature: "GCSE library", free: "A starter topic in every subtopic", pro: "Every topic in every subject" },
  { feature: "Exam Answer Coach", free: `${PLAN_LIMITS.free.coachLessonsPerDay} lessons a day`, pro: "Unlimited lessons" },
  { feature: "Quizzes and flashcards", free: "Included", pro: "Included" },
  { feature: "Exam Map", free: "Included", pro: "Included" },
  { feature: "AI study help", free: `${PLAN_LIMITS.free.aiExplanationsPerDay} explanations a day`, pro: `${PLAN_LIMITS.pro.aiExplanationsPerDay} explanations a day` },
  { feature: "Live games and classes", free: "Included", pro: "Included" },
];
