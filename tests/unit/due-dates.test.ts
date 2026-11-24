import { describe, expect, it } from "vitest";
import { dueDayLabel, dueText } from "@/domain/due-dates";

describe("due dates", () => {
  // Due at the end of Saturday 28 November 2026 (UK time) = midnight starting Sunday.
  const due = "2026-11-29T00:00:00.000Z";

  it("labels the UK day the work is due", () => {
    expect(dueDayLabel(due)).toBe("Sat 28 Nov");
  });

  it("says today, tomorrow, a day, or that it was due", () => {
    expect(dueText(due, Date.parse("2026-11-28T10:00:00Z"))).toBe("Due today");
    expect(dueText(due, Date.parse("2026-11-27T10:00:00Z"))).toBe("Due tomorrow");
    expect(dueText(due, Date.parse("2026-11-24T10:00:00Z"))).toMatch(/^Due .*28 Nov$/);
    expect(dueText(due, Date.parse("2026-11-29T10:00:00Z"))).toMatch(/^Was due .*28 Nov$/);
  });
});
