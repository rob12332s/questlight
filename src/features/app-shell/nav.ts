import {
  BookOpenCheck,
  Brain,
  Gauge,
  GraduationCap,
  Layers,
  ListChecks,
  Medal,
  Settings,
  Swords,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { FEATURES } from "@/config/features";
import type { FeatureStatus } from "@/components/ui/status-badge";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Items backed by a feature that isn't available yet render disabled, with an explanation. */
  featureId?: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/learn", label: "Learn", icon: BookOpenCheck, featureId: "quizzes" },
  { href: "/quizzes", label: "Quizzes", icon: ListChecks, featureId: "quizzes" },
  { href: "/flashcards", label: "Flashcards", icon: Layers, featureId: "flashcards" },
  { href: "/ai-study", label: "AI study", icon: Brain, featureId: "ai-study" },
  { href: "/play", label: "Multiplayer", icon: Swords, featureId: "live-games" },
  { href: "/classes", label: "Classes", icon: GraduationCap, featureId: "classrooms" },
  { href: "/leaderboards", label: "Leaderboards", icon: Trophy, featureId: "leaderboards" },
  { href: "/achievements", label: "Achievements", icon: Medal, featureId: "progression" },
];

export const SECONDARY_NAV: NavItem[] = [{ href: "/settings", label: "Profile and settings", icon: Settings }];

export function navStatus(item: NavItem): FeatureStatus {
  if (!item.featureId) return "available";
  return FEATURES.find((f) => f.id === item.featureId)?.status ?? "planned";
}
