import type { Metadata } from "next";
import { Check, Crown, FlaskConical, Lock } from "lucide-react";
import { redirect } from "next/navigation";
import { formatProPrice, PAYMENTS_LIVE, PLAN_COMPARISON } from "@/config/plans";
import { TestModeForm } from "@/features/pro/test-mode-form";
import { getLibrary, getPlan } from "@/server/library";
import { getCurrentStudent } from "@/server/session";

export const metadata: Metadata = { title: "Questlight Pro" };

const STATUS_TEXT: Record<string, string> = {
  active: "Pro is active.",
  pending: "Your payment is pending. Pro starts once it's confirmed.",
  cancelled: "Your Pro is cancelled and stays on until the end of the period already paid for.",
  expired: "Your Pro has expired. You're on the free plan.",
  failed: "Your last payment failed, so Pro is paused. You're on the free plan.",
};

export default async function ProPage() {
  const student = await getCurrentStudent();
  if (!student) redirect("/login?next=/pro");
  const [plan, library] = await Promise.all([getPlan(), getLibrary()]);
  const total = library.length;
  const lessons = library.filter((t) => t.contentStatus === "lesson").length;
  const free = library.filter((t) => t.access === "free").length;
  const testMode = process.env.PAYMENTS_TEST_MODE === "1";

  return (
    <div className="room-glow">
      <p className="flex items-center gap-2 text-sm font-medium text-pro">
        <Crown className="h-4 w-4" aria-hidden /> Questlight Pro
      </p>
      <h1 className="mt-2 max-w-2xl text-3xl font-semibold sm:text-4xl">One affordable subscription. The whole Questlight library.</h1>
      <p className="mt-3 text-2xl font-semibold text-pro">{formatProPrice()}</p>

      <section className="mt-8 rounded-2xl border border-line bg-deep p-5 sm:p-7" aria-labelledby="plan-heading">
        <h2 id="plan-heading" className="font-semibold">
          Your plan
        </h2>
        <p className="mt-2 text-ink-soft">
          {plan.status ? STATUS_TEXT[plan.status] : "You're on the free plan."}
          {plan.pro && plan.currentPeriodEnd && ` Current period ends ${new Date(plan.currentPeriodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}.`}
          {plan.testMode && " (Test mode — no real payment.)"}
        </p>
      </section>

      <section className="mt-8" aria-labelledby="compare-heading">
        <h2 id="compare-heading" className="text-lg font-semibold">
          Free and Pro
        </h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate/50">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  <span className="sr-only">Feature</span>
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Free
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-pro">
                  Pro · {formatProPrice()}
                </th>
              </tr>
            </thead>
            <tbody>
              {PLAN_COMPARISON.map((r) => (
                <tr key={r.feature} className="border-t border-line align-top">
                  <th scope="row" className="px-4 py-3 font-medium">
                    {r.feature}
                  </th>
                  <td className="px-4 py-3 text-ink-soft">{r.free}</td>
                  <td className="px-4 py-3">
                    <Check className="mr-1.5 inline h-4 w-4 text-pro" aria-hidden />
                    {r.pro}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-ink-muted">
          Today the library lists {total} GCSE topics, {free} of them free. {lessons} have a full Exam Answer Coach lesson; the rest are clearly
          marked as quiz practice or being written. Pro includes new lessons as they&apos;re published — we only list what actually exists.
        </p>
      </section>

      {!PAYMENTS_LIVE && (
        <section className="mt-8 rounded-2xl border border-line bg-deep p-5 sm:p-7" aria-labelledby="checkout-heading">
          <h2 id="checkout-heading" className="flex items-center gap-2 font-semibold">
            <Lock className="h-4 w-4" aria-hidden /> Checkout isn&apos;t open yet
          </h2>
          <p className="mt-2 max-w-prose text-ink-soft">
            Questlight is used by students under 18, so paying for Pro will need a parent or guardian. That checkout is being set up and
            reviewed before any payment can be taken. Until it opens, nothing is charged and the free plan stays free.
          </p>
          <p className="mt-3 text-sm text-ink-muted">
            When it opens: {formatProPrice("long")}, billed monthly, cancel any time. If you cancel, Pro stays on until the end of the month
            already paid for.
          </p>
        </section>
      )}

      {testMode && (
        <section className="mt-8 rounded-2xl border border-dashed border-caution/50 p-5 sm:p-7" aria-labelledby="test-heading">
          <h2 id="test-heading" className="flex items-center gap-2 font-semibold text-caution">
            <FlaskConical className="h-4 w-4" aria-hidden /> Test mode
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            This site is running in payment test mode. Choose a subscription state for your own account to check how Pro access behaves. No
            payment is taken and nothing here is real.
          </p>
          <TestModeForm />
        </section>
      )}
    </div>
  );
}
