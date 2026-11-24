"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { simulateSubscription, type SimState } from "./actions";

const OPTIONS = [
  { value: "free", label: "Free" },
  { value: "active", label: "Pro active" },
  { value: "pending", label: "Payment pending" },
  { value: "cancelled", label: "Cancelled (until period end)" },
  { value: "expired", label: "Expired" },
  { value: "failed", label: "Failed payment" },
];

export function TestModeForm() {
  const [state, action, pending] = useActionState<SimState, FormData>(simulateSubscription, {});
  return (
    <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-soft">Subscription state</span>
        <select name="status" className="h-10 rounded-md border border-line-strong bg-night px-3" defaultValue="active">
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="secondary" disabled={pending}>
        Apply test state
      </Button>
      <p role="status" className="w-full text-sm">
        {state.message && <span className="text-correct">{state.message}</span>}
        {state.error && <span className="text-incorrect">{state.error}</span>}
      </p>
    </form>
  );
}
