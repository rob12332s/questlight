import {
  Atom,
  BookOpen,
  FlaskConical,
  Globe,
  Landmark,
  Leaf,
  Microscope,
  PenLine,
  Sigma,
  type LucideIcon,
} from "lucide-react";
import type { SubjectSlug } from "@/config/subjects";

const icons: Record<SubjectSlug, LucideIcon> = {
  maths: Sigma,
  "english-language": PenLine,
  "english-literature": BookOpen,
  biology: Leaf,
  chemistry: FlaskConical,
  physics: Atom,
  "combined-science": Microscope,
  history: Landmark,
  geography: Globe,
};

export function SubjectIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = icons[slug as SubjectSlug] ?? BookOpen;
  return <Icon className={className} aria-hidden strokeWidth={1.75} />;
}
