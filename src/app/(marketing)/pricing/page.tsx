import type { Metadata } from "next";
import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Questlight is free during early access. Paid plans are planned but not yet available.",
};

const PLANS = [
  {
    name: "Free",
    who: "For every student",
    price: "Free",
    status: "available" as const,
    points: [
      "Revision quizzes and flashcards",
      "Live games with friends",
      "Progress by topic",
      "A daily allowance of AI study help",
    ],
  },
  {
    name: "Student Pro",
    who: "For students who revise every day",
    price: "Not available yet",
    status: "planned" as const,
    points: ["Higher AI limits", "Deeper progress insights", "Extra revision tools"],
  },
  {
    name: "Teacher Pro",
    who: "For teachers running classes",
    price: "Not available yet",
    status: "planned" as const,
    points: ["Classroom management", "Write your own quizzes", "Class reports"],
  },
  {
    name: "School",
    who: "For departments and schools",
    price: "Not available yet",
    status: "planned" as const,
    points: ["Multiple teachers", "School administration", "School-level reporting"],
  },
];

export default function PricingPage() {
  return (
    <div className="container-page py-16 sm:py-20">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-semibold sm:text-5xl">Pricing</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Questlight is free while it&apos;s in early access. Paid plans are planned for later, and the free plan is
          designed to stay genuinely useful on its own. We don&apos;t take payments yet.
        </p>
      </header>

      <ul className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((plan, i) => (
          <li
            key={plan.name}
            className={cn(
              "flex flex-col rounded-xl border p-6",
              i === 0 ? "border-beam/40 bg-deep shadow-raised" : "border-line",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <StatusBadge status={plan.status} />
            </div>
            <p className="mt-1 text-sm text-ink-muted">{plan.who}</p>
            <p className={cn("mt-6 font-semibold", i === 0 ? "text-3xl" : "text-base text-ink-soft")}>{plan.price}</p>
            <ul className="mt-6 flex-1 space-y-2.5">
              {plan.points.map((point) => (
                <li key={point} className="flex gap-2 text-sm text-ink-soft">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
            {i === 0 && (
              <ButtonLink href="/signup" className="mt-8">
                Create a free account
              </ButtonLink>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-8 max-w-2xl text-sm text-ink-muted">
        Some free features are still being built. Check the features page for what&apos;s available today.
      </p>
    </div>
  );
}
