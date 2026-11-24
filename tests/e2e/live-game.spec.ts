import { expect, test, type Page } from "@playwright/test";

/**
 * Two students play a whole live game against the local Supabase stack (CI only):
 * create, share the code, join, play every round with Realtime updates, see results.
 */
test.skip(!process.env.E2E_WITH_SUPABASE, "needs the local Supabase stack (CI)");

const run = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const password = `Test-${run}-pw!`;

function crashesOn(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
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

async function answerFirstOption(page: Page) {
  const first = page.getByRole("group", { name: "Answer options" }).getByRole("button").first();
  await expect(first).toBeEnabled({ timeout: 15_000 });
  await first.click();
}

test("two students play a live game together", async ({ page, browser }, testInfo) => {
  test.setTimeout(240_000);
  const project = testInfo.project.name;
  const host = page;
  const hostErrors = crashesOn(host);
  await signUp(host, "Game Host", `host-${run}-${project}@example.com`);

  // ── Host creates a game ──────────────────────────────────────────────────
  await host.goto("/play");
  await expect(host.getByRole("heading", { name: "Live games", level: 1 })).toBeVisible();
  await host.getByLabel("Questions from").selectOption({ label: "All of Physics" });
  await host.getByText("5", { exact: true }).click();
  await host.getByText("15s", { exact: true }).click();
  await host.getByRole("button", { name: "Create game" }).click();
  await expect(host).toHaveURL(/\/play\/[0-9a-f-]{36}$/);
  const gameUrl = host.url();
  const code = (await host.getByTestId("room-code").textContent())?.trim() ?? "";
  expect(code).toMatch(/^[BCDFGHJKMNPQRSTVWXZ2-9]{6}$/);
  await expect(host.getByRole("button", { name: "Start game" })).toBeDisabled();

  // ── A friend joins with the shared link ──────────────────────────────────
  const friendContext = await browser.newContext();
  const friend = await friendContext.newPage();
  const friendErrors = crashesOn(friend);
  await signUp(friend, "Game Friend", `friend-${run}-${project}@example.com`);
  await friend.goto(`/play?code=${code}`);
  await expect(friend.getByLabel("Game code")).toHaveValue(code);
  await friend.getByRole("button", { name: "Join game" }).click();
  await expect(friend).toHaveURL(gameUrl);
  await expect(friend.getByText("Waiting for Game Host to start the game")).toBeVisible();

  // The host sees the friend arrive without reloading.
  await expect(host.getByRole("heading", { name: /Players \(2\)/ })).toBeVisible({ timeout: 15_000 });
  await host.getByRole("button", { name: "Start game" }).click();

  // ── Five rounds ──────────────────────────────────────────────────────────
  for (let i = 1; i <= 5; i++) {
    for (const p of [host, friend]) {
      await expect(p.getByText(`Question ${i} of 5`)).toBeVisible({ timeout: 15_000 });
    }
    await answerFirstOption(friend);
    await expect(friend.getByText("Locked in. Waiting for everyone else…")).toBeVisible();
    await expect(host.getByText("1 of 2 answered")).toBeVisible({ timeout: 10_000 });
    await answerFirstOption(host);

    // Everyone answered, so the round closes early and both see the reveal together.
    for (const p of [host, friend]) {
      await expect(p.getByRole("heading", { name: "Standings" })).toBeVisible({ timeout: 15_000 });
    }
    if (i < 5) {
      await expect(friend.getByText("Waiting for the host to move on…")).toBeVisible();
      await host.getByRole("button", { name: "Next question" }).click();
    }
  }

  // ── Results ──────────────────────────────────────────────────────────────
  for (const p of [host, friend]) {
    await p.getByRole("button", { name: "See final results" }).click();
    await expect(p.getByRole("heading", { name: "Final results" })).toBeVisible();
    await expect(p.getByText(/You finished (1st|2nd) of 2/)).toBeVisible();
    await expect(p.getByText(/\+\d+ XP/)).toBeVisible({ timeout: 10_000 });
    await expect(p.getByRole("list", { name: "Final standings" }).getByRole("listitem")).toHaveCount(2);
  }

  // A finished game no longer shows as open.
  await friend.goto("/play");
  await expect(friend.getByRole("heading", { name: "Your open games" })).toHaveCount(0);

  // Someone who wasn't in the game can't open it.
  const outsiderContext = await browser.newContext();
  const outsider = await outsiderContext.newPage();
  await signUp(outsider, "Outsider", `outsider-${run}-${project}@example.com`);
  await outsider.goto(gameUrl);
  await expect(outsider.getByRole("heading", { name: "We couldn't find that." })).toBeVisible();

  expect(hostErrors).toEqual([]);
  expect(friendErrors).toEqual([]);
  await outsiderContext.close();
  await friendContext.close();
});
