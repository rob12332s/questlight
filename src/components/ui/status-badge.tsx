import { cn } from "@/lib/cn";

export type FeatureStatus = "available" | "in_development" | "planned";

const labels: Record<FeatureStatus, string> = {
  available: "Available",
  in_development: "In development",
  planned: "Planned",
};

const styles: Record<FeatureStatus, string> = {
  available: "text-correct bg-correct/10",
  in_development: "text-beam-bright bg-beam-wash",
  planned: "text-ink-soft bg-slate",
};

/** Honest status label so nothing on the site implies a feature works before it does. */
export function StatusBadge({ status, className }: { status: FeatureStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-sm px-2 text-xs font-medium whitespace-nowrap",
        styles[status],
        className,
      )}
    >
      {labels[status]}
    </span>
  );
}
