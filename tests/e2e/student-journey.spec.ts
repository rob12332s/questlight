import { expect, test, type Page } from "@playwright/test";

/**
 * The full student journey against a real (local, throwaway) Supabase stack.
 * Runs in CI where `supabase start` provides the backend; skipped elsewhere.
 * Accounts use random test emails and generated passwords that exist only in the
 * local test database.
 */
test.skip(!process.env.E2E_WITH_SUPABASE, "needs the local Supabase stack (CI)");
test.describe.configure({ mode: "serial" });

const run = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const password = `Test-${run}-pw!`;

function errorsOn(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

async function signUp(page: Page, name: string, email: string) {
  await page.goto("/signup");
  await page.getByLabel("Display name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function logIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
}

test("a student signs up, studies, and their data stays private", async ({ browser }, testInfo) => {
  test.setTimeout(180_000);
  const email = `student-${run}-${testInfo.project.name}@example.com`;
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = errorsOn(page);

  // ── Sign up ──────────────────────────────────────────────────────────────
  await signUp(page, "Test Student", email);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hi, Test Student");
  await expect(page.getByText("Choose the subjects you're studying")).toBeVisible();

  // ── Choose subjects ──────────────────────────────────────────────────────
  await page.goto("/settings");
  await page.getByRole("checkbox", { name: "Biology" }).check();
  await page.getByRole("checkbox", { name: "Mathematics" }).check();
  await page.getByRole("button", { name: "Save subjects" }).click();
  await expect(page.getByText("Saved 2 subjects.")).toBeVisible();

  // ── Learn page lists the subject's topics ───────────────────────────────
  await page.goto("/learn");
  await expect(page.getByRole("heading", { name: "Cell biology" })).toBeVisible();

  // ── Take a 5-question quiz ───────────────────────────────────────────────
  await page.goto("/quizzes");
  await page.getByRole("radio", { name: /^Biology/ }).check({ force: true });
  await page.getByRole("radio", { name: /^Cell biology/ }).check({ force: true });
  await page.getByRole("radio", { name: "5", exact: true }).check({ force: true });
  await expect(page.getByText(/5 questions on/)).toBeVisible();
  await page.getByRole("button", { name: "Start quiz" }).click();
  await expect(page).toHaveURL(/\/quizzes\/[0-9a-f-]{36}$/);
  const quizUrl = page.url();

  let previousCard: string | null = null;
  for (let i = 1; i <= 5; i++) {
    await expect(page.getByText(`Question ${i} of 5`)).toBeVisible();
    // Wait for the previous card's exit animation, so we answer the new question.
    const card = page.locator('section[aria-labelledby^="q-"]');
    await expect(card).toHaveCount(1);
    if (previousCard) await expect(card).not.toHaveAttribute("aria-labelledby", previousCard);
    previousCard = await card.getAttribute("aria-labelledby");
    await expect(page.getByText(/^(Correct|Not quite)/)).toHaveCount(0);
    const textbox = page.getByPlaceholder("Type your answer");
    if (await textbox.isVisible()) {
      await textbox.fill("osmosis");
      await page.getByRole("button", { name: "Check answer" }).click();
    } else {
      await page.getByRole("group", { name: "Answer options" }).getByRole("button").first().click();
    }
    // The server checks the answer; only then does the Next button appear.
    const next = page.getByRole("button", { name: i < 5 ? "Next question" : "See results" });
    await expect(next).toBeVisible({ timeout: 15_000 });
    // Scoped to <main>: Next.js adds its own role="alert" route announcer.
    await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
    await next.click();
  }
  await expect(page.getByRole("heading", { name: "Cell biology: results" })).toBeVisible();
  await expect(page.getByText("XP earned")).toBeVisible();
  await expect(page.getByText("Achievement unlocked: First steps")).toBeVisible();

  // ── Progress shows up on the dashboard ──────────────────────────────────
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Recent quizzes" })).toBeVisible();
  await expect(page.locator("dd").first()).toHaveText("5");

  // Re-opening a finished quiz shows the review, not the questions again.
  await page.goto(quizUrl);
  await expect(page.getByRole("heading", { name: "Cell biology: results" })).toBeVisible();

  // ── Achievements ─────────────────────────────────────────────────────────
  await page.goto("/achievements");
  await expect(page.getByText(/Earned .*\+25 XP/)).toBeVisible();

  // ── Flashcards: create, add, review ─────────────────────────────────────
  await page.goto("/flashcards");
  await page.getByLabel("Deck name").fill("Organelles");
  await page.getByRole("button", { name: "Create deck" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Organelles" })).toBeVisible();
  for (const [front, back] of [
    ["What do ribosomes make?", "Proteins"],
    ["Where does aerobic respiration happen?", "Mitochondria"],
  ]) {
    await page.getByLabel("Front").fill(front!);
    await page.getByLabel("Back").fill(back!);
    await page.getByRole("button", { name: "Add card" }).click();
    await expect(page.getByText(front!)).toBeVisible();
  }
  await page.getByRole("link", { name: "Review 2 cards" }).click();
  await expect(page.getByText("2 cards left")).toBeVisible();
  await page.getByRole("button", { name: /Showing question/ }).click();
  await page.getByRole("button", { name: /^Confident/ }).click();
  await expect(page.getByRole("button", { name: /^Confident/ })).toBeHidden();
  await expect(page.getByText("1 card left")).toBeVisible();
  await page.getByRole("button", { name: /Showing question/ }).click();
  await page.getByRole("button", { name: /^Need more practice/ }).click();
  await expect(page.getByRole("button", { name: /^Need more practice/ })).toBeHidden();
  // A struggling card comes back in the same session.
  await expect(page.getByText("1 card left")).toBeVisible();
  await page.getByRole("button", { name: /Showing question/ }).click();
  await page.getByRole("button", { name: /^Learning/ }).click();
  await expect(page.getByRole("button", { name: /^Learning/ })).toBeHidden();
  await expect(page.getByRole("heading", { name: "Review done" })).toBeVisible();

  // ── Another student can't see any of it ─────────────────────────────────
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await signUp(otherPage, "Other Student", `other-${run}-${testInfo.project.name}@example.com`);
  // App pages stream behind a loading state, so check what is shown rather than
  // the status code: the other student gets "not found" and none of the quiz.
  await otherPage.goto(quizUrl);
  await expect(otherPage.getByRole("heading", { name: "We couldn't find that." })).toBeVisible();
  await expect(otherPage.getByText("Cell biology")).toHaveCount(0);
  await otherPage.goto("/flashcards");
  await expect(otherPage.getByText("No decks yet")).toBeVisible();
  await other.close();

  // ── Log out, log back in ────────────────────────────────────────────────
  await page.goto("/settings");
  if (testInfo.project.name === "mobile") {
    // On phones the log-out button lives in the menu.
    await page.getByRole("button", { name: "Open menu" }).click();
  }
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login\?signedOut=1/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  await logIn(page, email);
  await expect(page).toHaveURL(/\/dashboard$/);

  // ── Delete the account ──────────────────────────────────────────────────
  await page.goto("/settings");
  await page.getByLabel('Type "delete" to confirm').fill("delete");
  await page.getByRole("button", { name: "Delete my account permanently" }).click();
  await expect(page).toHaveURL(/\/login\?deleted=1/);
  await logIn(page, email);
  await expect(page.getByText("That email and password don't match")).toBeVisible();

  expect(errors).toEqual([]);
  await context.close();
});

test("wrong passwords and invalid input get clear messages", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(`nobody-${run}@example.com`);
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("That email and password don't match")).toBeVisible();

  await page.goto("/signup");
  await page.getByLabel("Display name").fill("x");
  await page.getByLabel("Email").fill("someone@icloud.con");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Use at least 3 characters.")).toBeVisible();
  await expect(page.getByText("Did you mean someone@icloud.com?")).toBeVisible();
  await expect(page.getByText("You need to be 13 or older")).toBeVisible();
});
