/** Joins class names, skipping falsy values. Deliberately tiny — no dependency needed. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
