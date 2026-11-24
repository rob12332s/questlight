import { expect, test } from "@playwright/test";

/**
 * The Exam Answer Coach, the library, the Exam Map and Pro access, end to end on the local
 * stack. Pro is switched on with the test-mode simulator (PAYMENTS_TEST_MODE, CI only):
 * no payment exists anywhere in this flow.
 */
test.skip(!process.env.E2E_WITH_SUPABASE || process.env.PAYMENTS_TEST_MODE !== "1", "needs the local stack in payment test mode (CI)");

const run = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

test("a student learns a topic with the coach, sees it on the Exam Map, and meets Pro", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/signup");
  await page.getByLabel("Display name").fill("Coach Learner");
  await page.getByLabel("Email").fill(`coach-${run}-${testInfo.project.name}@example.com`);
  await page.getByLabel("Password").fill(`Test-${run}-pw!`);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  // ── Course setup: subject, board and tier ───────────────────────────────
  await page.goto("/settings");
  await page.locator("label", { hasText: "Mathematics" }).first().click();
  await page.getByRole("button", { name: "Save subjects" }).click();
  await expect(page.getByText("Saved 1 subject.")).toBeVisible();
  await page.reload();
  const courses = page.getByRole("region", { name: "Your courses" });
  await courses.getByLabel("Exam board").selectOption("aqa");
  await courses.getByLabel("Tier").selectOption("higher");
  await courses.getByRole("button", { name: "Save Mathematics" }).click();
  await expect(courses.getByText("Course saved.")).toBeVisible();

  // ── Library → topic page ────────────────────────────────────────────────
  await page.goto("/library");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Understand the topic");
  await page.getByRole("link", { name: /Mathematics/ }).first().click();
  await expect(page).toHaveURL(/\/library\/maths$/);
  await expect(page.getByText("AQA").first()).toBeVisible();
  await page.getByRole("link", { name: /Solving linear equations/ }).click();
  await expect(page.getByRole("heading", { name: "Solving linear equations", level: 1 })).toBeVisible();
  await expect(page.getByText("Verified coverage")).toBeVisible();

  // ── Worked example: the student chooses each step ──────────────────────
  await page.getByRole("link", { name: /Walk me through a worked example/ }).click();
  await expect(page).toHaveURL(/\/coach\/[0-9a-f-]{36}\?mode=worked/);
  await page.getByRole("button", { name: "Expand the bracket: 3x − 4 = 2x + 5" }).click();
  await expect(page.getByText("Not quite.")).toBeVisible();
  await page.getByRole("button", { name: "Expand the bracket: 3x − 12 = 2x + 5" }).click();
  await expect(page.getByText("That's right.")).toBeVisible();
  await page.getByRole("button", { name: "Next step" }).click();
  await page.getByRole("button", { name: "Subtract 2x from both sides: x − 12 = 5" }).click();
  await page.getByRole("button", { name: "Next step" }).click();
  await page.getByRole("button", { name: "Add 12 to both sides: x = 17" }).click();
  await page.getByRole("button", { name: "See the full answer" }).click();
  await expect(page.getByRole("heading", { name: "The complete answer" })).toBeVisible();
  await expect(page.getByText("2 of 3 steps right first time")).toBeVisible();

  // ── Guided practice with a hint ─────────────────────────────────────────
  await page.getByRole("link", { name: /Now try a similar question/ }).click();
  await page.getByRole("button", { name: "Give me a hint" }).click();
  await expect(page.getByText("Subtract 2x from both sides.")).toBeVisible();
  await page.getByLabel("Solve 5x + 7 = 2x − 8").fill("-5");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByText("Correct!")).toBeVisible();

  // ── Independent test, marked on the server ──────────────────────────────
  const coachUrl = page.url().split("?")[0];
  await page.goto(`${coachUrl}?mode=test`);
  await page.locator("#exam-0").fill("3");
  await page.getByRole("button", { name: "Submit answer" }).first().click();
  await expect(page.getByText("Correct — 3/3")).toBeVisible();
  await page.locator("#exam-1").fill("2");
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByText("Not correct. The answer is -1.")).toBeVisible();
  // Method marks: ticks the first two points; the final-answer point can't be ticked.
  const boxes = page.getByRole("checkbox");
  await boxes.nth(0).check();
  await expect(boxes.nth(2)).toBeDisabled();
  await page.getByRole("button", { name: "Finish and see my marks" }).click();
  await expect(page.getByText("Your mark")).toBeVisible();
  await expect(page.getByText("/6")).toBeVisible();
  await expect(page.getByText(/isn't an official exam-board mark/)).toBeVisible();
  await expect(page.getByText("Sign errors")).toBeVisible();

  // ── Exam Map ────────────────────────────────────────────────────────────
  await page.goto("/exam-map");
  await expect(page.getByRole("heading", { name: "Recent marks" })).toBeVisible();
  await expect(page.getByText("4/6")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your next steps" })).toBeVisible();

  // ── Pro: locked on free, open in test-mode Pro ──────────────────────────
  await page.goto("/library/maths");
  await page.getByRole("button", { name: /Percentage change and multipliers/ }).click();
  const dialog = page.getByRole("dialog", { name: "Questlight Pro" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("£5/month")).toBeVisible();
  await expect(dialog.getByText(/checkout isn't open yet/i)).toBeVisible();
  await dialog.getByRole("button", { name: "Not now" }).click();
  await expect(dialog).toBeHidden();
  await page.goto("/library/maths/percentage-change");
  await expect(page.getByText("A full coach lesson is ready — in Pro")).toBeVisible();

  await page.goto("/pro");
  await expect(page.getByText("Checkout isn't open yet")).toBeVisible();
  await page.getByLabel("Subscription state").selectOption("active");
  await page.getByRole("button", { name: "Apply test state" }).click();
  await expect(page.getByText(/Test subscription set to/)).toBeVisible();
  await page.goto("/library/maths/percentage-change");
  await page.getByRole("link", { name: /Teach me from the beginning/ }).click();
  await expect(page.getByRole("heading", { name: "What you need to know" })).toBeVisible();

  // Failed payment removes Pro again.
  await page.goto("/pro");
  await page.getByLabel("Subscription state").selectOption("failed");
  await page.getByRole("button", { name: "Apply test state" }).click();
  await expect(page.getByText(/Test subscription set to/)).toBeVisible();
  await page.goto("/library/maths/percentage-change");
  await expect(page.getByText("A full coach lesson is ready — in Pro")).toBeVisible();

  // Nothing overflows sideways on phones.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  expect(errors).toEqual([]);
});
