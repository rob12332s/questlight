import { BadgeCheck, CircleDashed, Crown, Lock } from "lucide-react";
import { SKILLS, type SkillId } from "@/content/library/types";
import { cn } from "@/lib/cn";
import { BOARD_NAMES, type Board } from "@/config/boards";
import type { LibraryTopic } from "@/features/library/types";

const chip = "inline-flex h-6 items-center gap-1 rounded-sm px-2 text-xs font-medium whitespace-nowrap";

export function ProBadge({ className, locked = false }: { className?: string; locked?: boolean }) {
  return (
    <span className={cn(chip, "bg-pro-wash text-pro", className)}>
      {locked ? <Lock className="h-3 w-3" aria-hidden /> : <Crown className="h-3 w-3" aria-hidden />}
      Pro
      {locked && <span className="sr-only"> — locked on the free plan</span>}
    </span>
  );
}

export const CONTENT_STATUS: Record<LibraryTopic["contentStatus"], { label: string; detail: string }> = {
  lesson: { label: "Full lesson", detail: "Exam Answer Coach lesson with worked example, guided practice and exam questions" },
  practice: { label: "Quiz practice", detail: "Quiz questions are ready; the coach lesson is being written" },
  planned: { label: "Being written", detail: "Listed so you can see the whole course; content is being written" },
};

export function StatusChip({ status }: { status: LibraryTopic["contentStatus"] }) {
  const s = CONTENT_STATUS[status];
  return (
    <span
      title={s.detail}
      className={cn(
        chip,
        status === "lesson" && "bg-beam-wash text-beam-bright",
        status === "practice" && "bg-slate text-ink",
        status === "planned" && "bg-transparent text-ink-muted shadow-[inset_0_0_0_1px_var(--color-line-strong)]",
      )}
    >
      {s.label}
    </span>
  );
}

/** Coverage and verification, said plainly. */
export function coverageText(t: Pick<LibraryTopic, "coverage" | "boards">): string {
  if (t.coverage === "shared") return "All boards (shared GCSE content)";
  if (t.coverage === "board_specific") return t.boards.map((b) => BOARD_NAMES[b]).join(", ") + " only";
  return "General GCSE revision";
}

export function VerificationChip({ verification }: { verification: LibraryTopic["verification"] }) {
  return verification === "verified" ? (
    <span className={cn(chip, "bg-correct/10 text-correct")} title="Checked against the published specification">
      <BadgeCheck className="h-3 w-3" aria-hidden /> Verified coverage
    </span>
  ) : (
    <span className={cn(chip, "bg-slate text-ink-soft")} title="Not yet checked line by line against a specification">
      <CircleDashed className="h-3 w-3" aria-hidden /> Awaiting verification
    </span>
  );
}

export function skillLabel(skill: string): string {
  return SKILLS[skill as SkillId] ?? skill;
}

export function tierLabel(tier: LibraryTopic["tier"]): string | null {
  return tier === "higher" ? "Higher tier" : tier === "foundation" ? "Foundation tier" : null;
}

/** Subject · board · tier · topic, shown on every learning page. */
export function LearningContext({
  subject,
  board,
  tier,
  topic,
}: {
  subject: string;
  board: Board | null;
  tier: "foundation" | "higher" | null;
  topic?: string;
}) {
  const parts = [subject, board ? BOARD_NAMES[board] : "Board not set", tier ? (tier === "higher" ? "Higher" : "Foundation") : null, topic].filter(Boolean);
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-soft" aria-label="Learning context">
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-ink-muted" />}
          <span className={cn(i === parts.length - 1 && topic && "text-ink")}>{p}</span>
        </span>
      ))}
    </p>
  );
}
