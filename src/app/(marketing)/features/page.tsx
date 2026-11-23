import type { Metadata } from "next";
import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { FEATURES } from "@/config/features";

export const metadata: Metadata = {
  title: "Features",
  description: "What Questlight does, and what is available today.",
};

export default function FeaturesPage() {
  return (
    <div className="container-page py-16 sm:py-20">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-semibold sm:text-5xl">Features</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Everything Questlight is building, and where each part is up to. We switch features on only when they work
          properly, and this page shows their status as it is now.
        </p>
      </header>

      <ul className="mt-14 divide-y divide-line border-y border-line">
        {FEATURES.map((feature) => (
          <li key={feature.id} id={feature.id} className="grid gap-4 py-8 md:grid-cols-[16rem_1fr] md:gap-12">
            <div className="flex items-start justify-between gap-3 md:flex-col md:justify-start">
              <h2 className="text-xl font-semibold">{feature.name}</h2>
              <StatusBadge status={feature.status} />
            </div>
            <div>
              <p className="max-w-2xl text-ink-soft">{feature.summary}</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {feature.details.map((detail) => (
                  <li key={detail} className="flex gap-2 text-sm text-ink-soft">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-12 flex flex-wrap items-center gap-4">
        <ButtonLink href="/signup">Create a free account</ButtonLink>
        <p className="text-sm text-ink-muted">New features appear in your account as soon as they&apos;re ready.</p>
      </div>
    </div>
  );
}
