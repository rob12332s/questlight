/**
 * Plan capabilities. Prices are deliberately NOT stored in code — they belong to the
 * billing provider when paid plans are introduced. Only the free plan is active in the MVP.
 */
export const PLAN_IDS = ["free", "student_pro", "teacher_pro", "school"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export interface PlanLimits {
  /** AI-generated practice questions per rolling 24 hours. */
  aiQuestionsPerDay: number;
  /** AI flashcard generation requests per rolling 24 hours. */
  aiFlashcardRequestsPerDay: number;
  /** Max questions in a single AI generation request. */
  aiMaxQuestionsPerRequest: number;
  /** Max players a host on this plan can allow in a private room. */
  maxRoomPlayers: number;
  canCreateClassrooms: boolean;
  canAuthorQuestions: boolean;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    aiQuestionsPerDay: 30,
    aiFlashcardRequestsPerDay: 5,
    aiMaxQuestionsPerRequest: 10,
    maxRoomPlayers: 30,
    canCreateClassrooms: false,
    canAuthorQuestions: false,
  },
  student_pro: {
    aiQuestionsPerDay: 200,
    aiFlashcardRequestsPerDay: 40,
    aiMaxQuestionsPerRequest: 20,
    maxRoomPlayers: 30,
    canCreateClassrooms: false,
    canAuthorQuestions: false,
  },
  teacher_pro: {
    aiQuestionsPerDay: 300,
    aiFlashcardRequestsPerDay: 60,
    aiMaxQuestionsPerRequest: 20,
    maxRoomPlayers: 40,
    canCreateClassrooms: true,
    canAuthorQuestions: true,
  },
  school: {
    aiQuestionsPerDay: 300,
    aiFlashcardRequestsPerDay: 60,
    aiMaxQuestionsPerRequest: 20,
    maxRoomPlayers: 40,
    canCreateClassrooms: true,
    canAuthorQuestions: true,
  },
};

/** Plans that can actually be assigned today. Paid plans stay inactive until billing exists. */
export const ACTIVE_PLANS: readonly PlanId[] = ["free"];

export function getPlanLimits(plan: PlanId | null | undefined): PlanLimits {
  return PLAN_LIMITS[plan && ACTIVE_PLANS.includes(plan) ? plan : "free"];
}
