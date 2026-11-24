import { expect, test } from "@playwright/test";

/**
 * AI study end to end, using the deterministic stand-in AI (AI_PROVIDER=mock, CI only):
 * explanations, AI practice questions (no XP), AI flashcard decks and daily allowances.
 */
test.skip(!process.env.E2E_WITH_SUPABASE || process.env.AI_PROVIDER !== "mock", "needs the local stack and the stand-in AI (CI)");

const run = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

test("a student uses AI study help", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/signup");
  await page.getByLabel("Display name").fill("AI Learner");
  await page.getByLabel("Email").fill(`ai-${run}-${testInfo.project.name}@example.com`);
  await page.getByLabel("Password").fill(`Test-${run}-pw!`);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/ai-study");
  await expect(page.getByRole("heading", { name: "AI study", level: 1 })).toBeVisible();
  await page.getByLabel("Topic").selectOption({ label: "Cell biology" });

  // ── Explain ──────────────────────────────────────────────────────────────
  await page.getByLabel("Your question").fill("Why do cells need a membrane?");
  await page.getByRole("button", { name: "Explain it" }).click();
  await expect(page.getByText("Here is a short explanation about Cell biology.")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Test yourself:")).toBeVisible();
  await expect(page.getByText(/Written by AI/)).toBeVisible();

  // ── Practice questions: just for practice ────────────────────────────────
  await page.getByRole("tab", { name: "Practice questions" }).click();
  await page.getByRole("button", { name: "Make practice questions" }).click();
  for (let i = 1; i <= 5; i++) {
    await expect(page.getByText(`AI practice, question ${i} of 5`)).toBeVisible({ timeout: 15_000 });
    await page.getByRole("group", { name: "Answer options" }).getByRole("button", { name: new RegExp(`Correct answer ${i}`) }).click();
    await expect(page.getByText("Correct", { exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: i < 5 ? "Next question" : "See score" }).click();
  }
  await expect(page.getByText("5/5")).toBeVisible();
  await expect(page.getByText(/doesn't change your XP or progress/)).toBeVisible();

  // ── Flashcards: a saved, labelled deck ───────────────────────────────────
  await page.getByRole("tab", { name: "Flashcards" }).click();
  await page.getByRole("button", { name: "Make a flashcard deck" }).click();
  await expect(page).toHaveURL(/\/flashcards\/[0-9a-f-]{36}/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Cell biology (AI)" })).toBeVisible();
  await expect(page.getByText(/AI-generated/)).toBeVisible();
  await expect(page.getByText("Test card 10 on Cell biology")).toBeVisible();

  // ── The allowance went down, and AI practice gave no XP ─────────────────
  await page.goto("/ai-study");
  const allowance = page.getByRole("region", { name: "Today's allowance" });
  await expect(allowance.getByText("19 left")).toBeVisible();
  await expect(allowance.getByText("25 left")).toBeVisible();
  await expect(allowance.getByText("4 left")).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.getByText("0 XP", { exact: true })).toBeVisible();

  expect(errors).toEqual([]);
});
