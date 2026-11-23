import { FileWarning } from "lucide-react";

/** Shown on legal pages until they have been reviewed by a qualified professional. */
export function DraftNotice() {
  return (
    <div className="mt-8 flex max-w-2xl gap-3 rounded-lg border border-caution/40 bg-caution/10 p-4 text-sm text-ink">
      <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-caution" aria-hidden />
      <p>
        <strong className="font-semibold">Draft for review.</strong> This page explains how Questlight works today in
        plain English. It has not yet been reviewed by a legal professional, and it will be updated before Questlight is
        offered to schools or takes any payments.
      </p>
    </div>
  );
}
