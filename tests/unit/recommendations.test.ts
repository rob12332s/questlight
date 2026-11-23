import { describe, expect, it } from "vitest";
import { recommendNext, type TopicFacts } from "@/domain/recommendations";

const now = new Date("2026-11-24T12:00:00Z");
const fact = (id: string, attempted: number, correct: number, mastery: number, daysAgo: number): TopicFacts => ({
  topicId: id,
  topicName: id,
  subjectName: "S",
  questionsAttempted: attempted,
  correctAnswers: correct,
  mastery,
  lastPractisedAt: new Date(now.getTime() - daysAgo * 86_400_000),
});

describe("recommendNext", () => {
  it("never judges a topic on too few answers", () => {
    expect(recommendNext([fact("tiny", 4, 0, 0, 0)], [], now)).toEqual([]);
  });

  it("puts weak topics first, with the measured reason", () => {
    const recs = recommendNext([fact("strong", 20, 19, 0.95, 1), fact("weak", 12, 5, 0.4, 1)], [], now);
    expect(recs[0]).toMatchObject({ kind: "revisit_weak", topicId: "weak", suggestedDifficulty: "foundation" });
    expect(recs[0]?.reason).toContain("42% correct over 12 answers");
    expect(recs[1]).toMatchObject({ kind: "stretch", topicId: "strong" });
  });

  it("suggests returning after a gap", () => {
    const recs = recommendNext([fact("gap", 15, 11, 0.7, 9)], [], now);
    expect(recs[0]).toMatchObject({ kind: "return_after_gap" });
    expect(recs[0]?.reason).toContain("9 days ago");
  });

  it("offers untried topics after weak and stale ones, and caps the list", () => {
    const untried = ["a", "b", "c", "d"].map((id) => ({ topicId: id, topicName: id, subjectName: "S" }));
    const recs = recommendNext([fact("weak", 10, 2, 0.2, 0)], untried, now);
    expect(recs.map((r) => r.kind)).toEqual(["revisit_weak", "start_new", "start_new"]);
  });
});
