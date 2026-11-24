import { Crown } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { formatProPrice } from "@/config/plans";
import { cn } from "@/lib/cn";

/** The dashboard's Pro panel, shown to free students. */
export function ProPanel({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="pro-panel-title"
      className={cn("relative overflow-hidden rounded-2xl border border-pro/25 bg-deep p-6 sm:p-7", className)}
    >
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-pro/10 blur-3xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-pro">
            <Crown className="h-4 w-4" aria-hidden /> Questlight Pro
          </p>
          <h2 id="pro-panel-title" className="mt-2 text-xl font-semibold">
            Unlock your full GCSE potential.
          </h2>
          <p className="mt-1 max-w-md text-ink-soft">Get access to every topic, every subject and the complete Exam Answer Coach.</p>
        </div>
        <Link href="/pro" className={cn(buttonClasses("secondary", "md"), "shrink-0 text-pro")}>
          Upgrade for {formatProPrice()}
        </Link>
      </div>
    </section>
  );
}

/** A slim banner for subject pages. */
export function ProSubjectBanner({ subject, lockedCount }: { subject: string; lockedCount: number }) {
  if (lockedCount === 0) return null;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-pro/25 bg-pro-wash px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm">
        <Crown className="mr-1.5 inline h-4 w-4 text-pro" aria-hidden />
        Pro unlocks the complete {subject} library — {lockedCount} more topic{lockedCount === 1 ? "" : "s"}.
      </p>
      <Link href="/pro" className="text-sm font-medium text-pro hover:underline">
        {formatProPrice()} · See Pro
      </Link>
    </div>
  );
}
