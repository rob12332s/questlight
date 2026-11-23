import { ButtonLink } from "@/components/ui/button";

/**
 * Shown inside the app shell when a page calls notFound(), for example a quiz
 * that doesn't exist or belongs to someone else. App pages stream behind a
 * loading state, so the HTTP status is already sent; the robots noindex tag is
 * added by Next.js.
 */
export default function AppNotFound() {
  return (
    <div className="py-10">
      <h1 className="text-3xl font-semibold">We couldn&apos;t find that.</h1>
      <p className="mt-3 max-w-md text-ink-soft">
        It may have been deleted, or the link may belong to another account.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/dashboard">Back to your dashboard</ButtonLink>
        <ButtonLink href="/learn" variant="secondary">
          Choose a topic
        </ButtonLink>
      </div>
    </div>
  );
}
