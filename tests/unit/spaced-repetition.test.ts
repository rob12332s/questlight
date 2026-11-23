import { describe, expect, it } from "vitest";
import { SR_LIMITS, scheduleReview, studyOrder } from "@/domain/spaced-repetition";

const now = new Date("2026-11-24T09:00:00Z");
const hours = (d: Date) => (d.getTime() - now.getTime()) / 3_600_000;

describe("scheduleReview", () => {
  it("brings back struggling cards within minutes", () => {
    const s = scheduleReview(null, "needs_practice", now);
    expect(hours(s.dueAt)).toBeLessThan(0.2);
    expect(s.ease).toBe(2.3);
    expect(s.reviewCount).toBe(1);
  });

  it("schedules new cards a day or three days out", () => {
    expect(scheduleReview(null, "learning", now).intervalDays).toBe(1);
    expect(scheduleReview(null, "confident", now).intervalDays).toBe(3);
  });

  it("grows intervals for cards you keep knowing", () => {
    let s = scheduleReview(null, "confident", now);
    const intervals = [s.intervalDays];
    for (let i = 0; i < 4; i++) {
      s = scheduleReview(s, "confident", now);
      intervals.push(s.intervalDays);
    }
    for (let i = 1; i < intervals.length; i++) expect(intervals[i]!).toBeGreaterThan(intervals[i - 1]!);
  });

  it("resets a forgotten card even after a long interval", () => {
    const s = scheduleReview({ intervalDays: 60, ease: 2.8, reviewCount: 9 }, "needs_practice", now);
    expect(s.intervalDays).toBeLessThanOrEqual(0.01);
    expect(hours(s.dueAt)).toBeLessThan(0.2);
    expect(s.reviewCount).toBe(10);
  });

  it("keeps ease and interval within limits", () => {
    let s = scheduleReview(null, "needs_practice", now);
    for (let i = 0; i < 20; i++) s = scheduleReview(s, "needs_practice", now);
    expect(s.ease).toBe(SR_LIMITS.minEase);
    let c = scheduleReview(null, "confident", now);
    for (let i = 0; i < 30; i++) c = scheduleReview(c, "confident", now);
    expect(c.ease).toBe(SR_LIMITS.maxEase);
    expect(c.intervalDays).toBeLessThanOrEqual(SR_LIMITS.maxIntervalDays);
  });
});

describe("studyOrder", () => {
  it("shows new cards first, then the most overdue, and hides future cards", () => {
    const card = (id: string, due: string | null, created = "2026-11-01T00:00:00Z") => ({
      id,
      dueAt: due ? new Date(due) : null,
      createdAt: new Date(created),
    });
    const order = studyOrder(
      [
        card("future", "2026-11-25T00:00:00Z"),
        card("overdue-1", "2026-11-23T00:00:00Z"),
        card("new-2", null, "2026-11-02T00:00:00Z"),
        card("overdue-2", "2026-11-20T00:00:00Z"),
        card("new-1", null, "2026-11-01T00:00:00Z"),
      ],
      now,
    ).map((c) => c.id);
    expect(order).toEqual(["new-1", "new-2", "overdue-2", "overdue-1"]);
  });
});
