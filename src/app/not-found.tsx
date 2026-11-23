import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="container-page flex min-h-dvh flex-col justify-center py-16">
      <Logo />
      <h1 className="mt-10 text-4xl font-semibold">That page doesn&apos;t exist.</h1>
      <p className="mt-3 max-w-md text-ink-soft">The link may be old, or the address may have a typo.</p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/">Go to the home page</ButtonLink>
        <ButtonLink href="/dashboard" variant="secondary">
          Open your dashboard
        </ButtonLink>
      </div>
    </main>
  );
}
