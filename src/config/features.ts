import type { FeatureStatus } from "@/components/ui/status-badge";

/**
 * The honest feature registry. Public pages and the app navigation read their
 * "available / in development / planned" labels from here, so the site never
 * implies something works before it does. Update a status only after the feature
 * has been built AND tested.
 */
export interface FeatureEntry {
  id: string;
  name: string;
  summary: string;
  details: string[];
  status: FeatureStatus;
}

export const FEATURES: FeatureEntry[] = [
  {
    id: "quizzes",
    name: "Revision quizzes",
    summary: "Pick a subject, topic, difficulty and length. One question at a time, with an explanation after each answer.",
    details: [
      "Multiple choice, true or false, and short answer",
      "Answers are checked on the server and never sent to your browser early",
      "Review everything you got wrong at the end",
    ],
    status: "available",
  },
  {
    id: "flashcards",
    name: "Flashcards",
    summary: "Make your own decks, then review them with spaced repetition. AI-generated decks are planned.",
    details: [
      "Rate each card: needs practice, learning or confident",
      "Cards you struggle with come back sooner",
      "Flipping a card isn't counted as knowing it; only your rating is",
    ],
    status: "available",
  },
  {
    id: "live-games",
    name: "Live games",
    summary: "Private rooms for friends, with a six-character code. Everyone gets the same question at the same time.",
    details: [
      "Speed bonus capped so accuracy always matters more",
      "Scores, timing and answers controlled by the server",
      "Rejoin if your connection drops",
    ],
    status: "available",
  },
  {
    id: "progress",
    name: "Progress and weak topics",
    summary: "Accuracy per topic, built from your real answers, with suggestions once there is enough data to be useful.",
    details: [
      "Measured results kept separate from estimates",
      "No recommendation until you've answered enough questions on a topic",
      "Suggestions to revisit topics after a sensible gap",
    ],
    status: "available",
  },
  {
    id: "ai-study",
    name: "AI study help",
    summary: "Ask about a concept, get it explained at your level, and generate practice questions or flashcards on it. Switched on by the site owner.",
    details: [
      "Every AI answer is checked against a strict format before you see it",
      "AI content is always labelled, and AI practice never counts towards XP",
      "Daily limits keep it fair and affordable",
    ],
    status: "available",
  },
  {
    id: "classrooms",
    name: "Classroom games",
    summary: "Teachers create a class with a private code and host live games for it.",
    details: [
      "Only class members can join a class game",
      "Teachers see results by display name",
      "Teacher accounts are verified, not self-selected",
    ],
    status: "available",
  },
  {
    id: "progression",
    name: "XP, levels and achievements",
    summary: "Rewards for learning, not for time spent. XP is calculated on the server and can't be farmed by repeating the same questions.",
    details: [
      "Learning streaks on UK calendar days",
      "Personal bests per topic",
      "A daily XP limit for solo practice",
    ],
    status: "available",
  },
  {
    id: "leaderboards",
    name: "Leaderboards",
    summary: "This week, all time, and the people you've played live games with. You only appear if you choose to.",
    details: [
      "Display names only, never real names, with offensive names refused",
      "Hidden by default; switch your name on or off at any time",
      "See where you'd place even while hidden",
    ],
    status: "available",
  },
];
