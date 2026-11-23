import { describe, expect, it } from "vitest";
import { displayNameProblem, suggestEmailFix } from "@/domain/profile";

describe("displayNameProblem (mirrors public.is_valid_display_name)", () => {
  it("accepts reasonable names", () => {
    for (const name of ["Ana", "mira.k", "Tomasz-11", "Big_Brain", "Year 11 Sam", "  padded  "]) {
      expect(displayNameProblem(name)).toBeNull();
    }
  });

  it("explains what is wrong", () => {
    expect(displayNameProblem("ab")).toBe("too_short");
    expect(displayNameProblem("a".repeat(25))).toBe("too_long");
    expect(displayNameProblem("<script>")).toBe("bad_characters");
    expect(displayNameProblem("émile")).toBe("bad_characters");
    expect(displayNameProblem("two  spaces")).toBe("double_space");
    expect(displayNameProblem("_edge")).toBe("bad_edges");
    expect(displayNameProblem("edge.")).toBe("bad_edges");
  });
});

describe("suggestEmailFix", () => {
  it("spots common typos", () => {
    expect(suggestEmailFix("sam@icloud.con")).toBe("sam@icloud.com");
    expect(suggestEmailFix("sam@gmial.com")).toBe("sam@gmail.com");
    expect(suggestEmailFix("sam@school.org.uk")).toBeNull();
    expect(suggestEmailFix("sam@example.co")).toBeNull();
    expect(suggestEmailFix("sam@gmail.com")).toBeNull();
  });
});
