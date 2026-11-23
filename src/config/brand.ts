/**
 * Single source of truth for branding. Rename the product by editing this file
 * (and the wordmark text in src/components/brand/logo.tsx picks it up automatically).
 * "Questlight" is a working name — see docs/BRAND.md. Run a trademark and domain
 * check before launch.
 */
export const brand = {
  name: "Questlight",
  tagline: "Revision that knows what you got wrong",
  description:
    "Quizzes, flashcards and live games for GCSE students — connected, so every answer helps decide what to study next.",
  supportEmail: "", // set before launch; empty hides contact links
} as const;

export type Brand = typeof brand;
