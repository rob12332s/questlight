import { brand } from "@/config/brand";
import { cn } from "@/lib/cn";

/**
 * The mark: an open orbit with a point of light travelling along it —
 * a quest (the path) and a light (the moment something clicks).
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-7 w-7", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path
        d="M26.5 12.4A11 11 0 1 1 19.6 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="24.6" cy="7.4" r="3.4" fill="var(--color-beam)" />
    </svg>
  );
}

/** Wordmark: the mark plus the name, set lowercase at a tight tracking. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-ink", className)}>
      <LogoMark />
      <span className="text-[1.3rem] leading-none font-semibold tracking-[-0.04em] lowercase">{brand.name}</span>
    </span>
  );
}
