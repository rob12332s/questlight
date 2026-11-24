"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Crown, Lock, X } from "lucide-react";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { formatProPrice, PAYMENTS_LIVE, PLAN_COMPARISON } from "@/config/plans";
import { buttonClasses } from "@/components/ui/button";

/**
 * The upgrade modal. Opened when a student chooses a locked topic or hits a free limit.
 * Prompts the app shows on its own (not in response to a click) are capped: at most one
 * every few days, so revision is never interrupted repeatedly. No timers, discounts or
 * scarcity — just what Pro includes and what it costs.
 */
const AUTO_PROMPT_GAP_MS = 3 * 24 * 60 * 60 * 1000;
const STORAGE_KEY = "ql-upgrade-prompted";

interface UpgradeContext {
  /** Open in response to a student's action (always shows). */
  open: (reason?: string) => void;
  /** Open on the app's initiative (shows at most once every few days). Returns whether it showed. */
  prompt: (reason?: string) => boolean;
}

const Ctx = createContext<UpgradeContext | null>(null);

export function useUpgrade(): UpgradeContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUpgrade must be used inside UpgradeProvider");
  return ctx;
}

export function UpgradeProvider({ children, isPro }: { children: React.ReactNode; isPro: boolean }) {
  const [state, setState] = useState<{ open: boolean; reason?: string }>({ open: false });

  const open = useCallback((reason?: string) => setState({ open: true, reason }), []);
  const prompt = useCallback(
    (reason?: string) => {
      if (isPro) return false;
      try {
        const last = Number(window.localStorage.getItem(STORAGE_KEY) ?? 0);
        if (Date.now() - last < AUTO_PROMPT_GAP_MS) return false;
        window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch {
        return false; // No storage: never auto-prompt rather than risk prompting every time.
      }
      setState({ open: true, reason });
      return true;
    },
    [isPro],
  );

  return (
    <Ctx.Provider value={{ open, prompt }}>
      {children}
      <UpgradeModal open={state.open} reason={state.reason} onClose={() => setState({ open: false })} />
    </Ctx.Provider>
  );
}

function UpgradeModal({ open, reason, onClose }: { open: boolean; reason?: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-night/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-title"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-line-strong bg-deep p-6 shadow-raised sm:rounded-2xl sm:p-8"
          >
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:bg-slate hover:text-ink"
            >
              <X className="h-5 w-5" aria-hidden />
              <span className="sr-only">Close</span>
            </button>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-pro-wash text-pro">
              <Crown className="h-5 w-5" aria-hidden />
            </span>
            <h2 id="upgrade-title" className="mt-4 text-2xl font-semibold">
              Questlight Pro
            </h2>
            {reason && <p className="mt-2 text-ink-soft">{reason}</p>}
            <p className="mt-3 text-ink">
              Every topic, every subject and the complete Exam Answer Coach.{" "}
              <span className="font-semibold text-pro">{formatProPrice()}</span>
            </p>

            <table className="mt-6 w-full text-left text-sm">
              <caption className="sr-only">Free and Pro compared</caption>
              <thead>
                <tr className="text-ink-muted">
                  <th scope="col" className="pb-2 font-medium">
                    &nbsp;
                  </th>
                  <th scope="col" className="pb-2 font-medium">
                    Free
                  </th>
                  <th scope="col" className="pb-2 font-medium text-pro">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {PLAN_COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-t border-line align-top">
                    <th scope="row" className="py-2.5 pr-3 font-medium">
                      {row.feature}
                    </th>
                    <td className="py-2.5 pr-3 text-ink-soft">{row.free}</td>
                    <td className="py-2.5 text-ink">
                      <Check className="mr-1 inline h-3.5 w-3.5 text-pro" aria-hidden />
                      {row.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {PAYMENTS_LIVE ? null : (
              <p className="mt-6 rounded-lg bg-slate p-4 text-sm text-ink-soft">
                <Lock className="mr-1.5 inline h-3.5 w-3.5" aria-hidden />
                Pro checkout isn&apos;t open yet. It will need a parent or guardian to complete it. Until then, nothing is
                charged and everything on the free plan stays free.
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/pro" onClick={onClose} className={buttonClasses("primary", "md")}>
                See what&apos;s in Pro
              </Link>
              <button type="button" onClick={onClose} className={buttonClasses("ghost", "md")}>
                Not now
              </button>
            </div>
            <p className="mt-4 text-xs text-ink-muted">
              {formatProPrice("long")}, cancel any time. Pro keeps working until the end of the month already paid for.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** A button that opens the upgrade modal (for locked topics and limit messages). */
export function UpgradeButton({ reason, children, className }: { reason?: string; children: React.ReactNode; className?: string }) {
  const { open } = useUpgrade();
  return (
    <button type="button" onClick={() => open(reason)} className={className}>
      {children}
    </button>
  );
}

/** Shows the modal once (frequency-capped) when a free limit is reached. */
export function LimitPrompt({ reason }: { reason: string }) {
  const { prompt } = useUpgrade();
  useEffect(() => {
    prompt(reason);
  }, [prompt, reason]);
  return null;
}
