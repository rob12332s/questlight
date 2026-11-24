/**
 * Work is due at the end of a UK day (stored as midnight at the start of the next day).
 * These helpers turn that into words students understand.
 */
const DAY_MS = 86_400_000;

/** The calendar day the work is due, in UK time, e.g. "Fri 28 Nov". */
export function dueDayLabel(dueIso: string): string {
  const lastMoment = new Date(Date.parse(dueIso) - 60_000);
  return lastMoment.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/London" });
}

/** "Due today", "Due tomorrow", "Due Fri 28 Nov" or "Was due Fri 28 Nov". */
export function dueText(dueIso: string, nowMs: number): string {
  const due = Date.parse(dueIso);
  if (due <= nowMs) return `Was due ${dueDayLabel(dueIso)}`;
  const daysLeft = Math.ceil((due - nowMs) / DAY_MS);
  if (daysLeft <= 1) return "Due today";
  if (daysLeft === 2) return "Due tomorrow";
  return `Due ${dueDayLabel(dueIso)}`;
}
