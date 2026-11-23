/**
 * Single source of truth for branding. Rename the product by editing this file.
 * "Questlight" is a working name — run a trademark/domain check before launch.
 */
export const brand = {
  name: "Questlight",
  shortName: "Questlight",
  tagline: "Learn it. Battle it. Own it.",
  description:
    "Live quiz battles with friends, focused solo revision and AI-assisted practice — with progress you can actually see.",
  supportEmail: "", // set before launch; leave empty to hide contact links
} as const;

export type Brand = typeof brand;
