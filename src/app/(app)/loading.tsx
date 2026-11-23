/** Shown instantly while an app page loads, so navigation never feels stuck. */
export default function AppLoading() {
  return (
    <div role="status" aria-live="polite" className="animate-enter-soft">
      <span className="sr-only">Loading…</span>
      <div className="skeleton h-9 w-56" />
      <div className="mt-3 skeleton h-4 w-32" />
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border border-line bg-deep p-6">
          <div className="skeleton h-4 w-16" />
          <div className="mt-2 skeleton h-10 w-12" />
          <div className="mt-5 skeleton h-2 w-full" />
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="skeleton h-16" />
            <div className="skeleton h-16" />
          </div>
        </div>
        <div className="rounded-xl border border-line p-6">
          <div className="skeleton h-5 w-32" />
          <div className="mt-5 space-y-4">
            <div className="skeleton h-6 w-full" />
            <div className="skeleton h-6 w-5/6" />
            <div className="skeleton h-6 w-2/3" />
          </div>
        </div>
      </div>
      <div className="mt-10 skeleton h-6 w-40" />
      <div className="mt-4 skeleton h-28 w-full rounded-xl" />
    </div>
  );
}
