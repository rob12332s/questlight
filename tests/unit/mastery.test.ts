import { describe, expect, it } from "vitest";
import { accuracyBySkill, accuracyByWeek, recommendNext, topicMastery, type Attempt } from "@/domain/mastery";
import { recurringMistakes } from "@/domain/mistakes";
import { markAnswer, parseNumber, selfCheckMarks, validateLesson } from "@/domain/lesson";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 10, 24, 12);
const a = (mode: Attempt["mode"], got: number, of: number, daysAgo: number, mistakes: string[] = [], topicId = "t1"): Attempt => ({
  topicId, mode, marksAwarded: got, marksAvailable: of, at: NOW - daysAgo * DAY, mistakes,
});

describe("mastery levels", () => {
  it("not started without attempts", () => {
    expect(topicMastery("t1", [], NOW).level).toBe("not_started");
  });

  it("supported practice alone is only Learning", () => {
    const m = topicMastery("t1", [a("worked", 3, 3, 1), a("guided", 3, 3, 1)], NOW);
    expect(m.level).toBe("learning");
    expect(m.recentAccuracy).toBeNull();
  });

  it("one perfect independent answer is not mastery", () => {
    expect(topicMastery("t1", [a("independent", 1, 1, 0)], NOW).level).toBe("nearly_mastered");
  });

  it("two strong scores on the same day are not mastery", () => {
    expect(topicMastery("t1", [a("independent", 5, 5, 0), a("independent", 5, 5, 0)], NOW).level).toBe("nearly_mastered");
  });

  it("two strong scores days apart, with enough marks, are mastery", () => {
    expect(topicMastery("t1", [a("independent", 5, 6, 5), a("retest", 6, 6, 0)], NOW).level).toBe("mastered");
  });

  it("tiny questions days apart still aren't enough marks", () => {
    expect(topicMastery("t1", [a("independent", 1, 1, 10), a("retest", 1, 1, 0)], NOW).level).toBe("nearly_mastered");
  });

  it("a weak latest score drops mastery", () => {
    const m = topicMastery("t1", [a("independent", 6, 6, 10), a("retest", 6, 6, 5), a("retest", 2, 6, 0)], NOW);
    expect(m.level).toBe("learning");
    expect(m.needsAnotherAttempt).toBe(true);
  });

  it("developing between 60% and 80%", () => {
    expect(topicMastery("t1", [a("independent", 4, 6, 0)], NOW).level).toBe("developing");
  });

  it("flags a retest after three weeks and spots improvement", () => {
    const m = topicMastery("t1", [a("independent", 2, 6, 40), a("independent", 6, 6, 30), a("retest", 6, 6, 25)], NOW);
    expect(m.level).toBe("mastered");
    expect(m.dueRetest).toBe(true);
    expect(m.improving).toBe(true);
  });
});

describe("recommendations", () => {
  it("prioritises weak topics and explains why", () => {
    const attempts = [a("independent", 1, 6, 1, [], "weak"), a("independent", 5, 6, 1, [], "close")];
    const topics = ["weak", "close", "new"].map((id) => ({ id, title: id, subject: "maths", skill: "calc" }));
    const mastery = new Map(topics.map((t) => [t.id, topicMastery(t.id, attempts, NOW)]));
    const recs = recommendNext(topics, mastery, []);
    expect(recs[0].topicId).toBe("weak");
    expect(recs[0].reason).toContain("1/6");
    expect(recs.some((r) => r.topicId === "new" && r.action === "start")).toBe(true);
  });
});

describe("progress over time", () => {
  it("buckets independent marks by week and by skill", () => {
    const attempts = [a("independent", 3, 4, 0), a("guided", 0, 4, 0), a("independent", 1, 4, 8)];
    const weeks = accuracyByWeek(attempts, 3, NOW);
    expect(weeks).toHaveLength(3);
    expect(weeks[2].accuracy).toBe(0.75);
    expect(accuracyBySkill(attempts, new Map([["t1", "calc"]]))[0]).toEqual({ skill: "calc", accuracy: 0.5, marks: 8 });
  });

  it("finds recurring mistakes and ignores unknown tags", () => {
    const r = recurringMistakes([{ mistakes: ["missing_units", "zzz"] }, { mistakes: ["missing_units"] }, { mistakes: ["sign_error"] }]);
    expect(r.map((x) => x.tag)).toEqual(["missing_units"]);
  });
});

describe("answer marking", () => {
  it("parses numbers with units, commas and fractions", () => {
    expect(parseNumber("£1,250")).toBe(1250);
    expect(parseNumber("12 cm")).toBe(12);
    expect(parseNumber("3/4")).toBe(0.75);
    expect(parseNumber("abc")).toBeNull();
  });

  it("marks numeric, text and choice answers", () => {
    expect(markAnswer({ type: "numeric", value: 4.3, tolerance: 0.05 }, "4.34").status).toBe("correct");
    expect(markAnswer({ type: "numeric", value: 4.3, tolerance: 0.05 }, "4.4").status).toBe("incorrect");
    expect(markAnswer({ type: "text", accept: ["slip-off slope"] }, "  Slip-off  slope ").status).toBe("correct");
    expect(markAnswer({ type: "choice", options: ["a", "b"], correct: 1 }, 1).status).toBe("correct");
    expect(markAnswer({ type: "extended" }, "anything").status).toBe("self_check");
  });

  it("totals self-checked mark points", () => {
    expect(selfCheckMarks([{ point: "x", marks: 2 }, { point: "y", marks: 1 }], [true, false])).toBe(2);
  });

  it("rejects malformed lesson JSON", () => {
    expect(validateLesson(null)).not.toEqual([]);
    expect(validateLesson({ style: "calculation" }).length).toBeGreaterThan(3);
  });
});
