import { expect, test, type Page } from "@playwright/test";

/** Fails the test if the page logs an error to the console or throws. */
function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

const PAGES = [
  { path: "/", heading: "Revision that knows what you got wrong." },
  { path: "/features", heading: "Features" },
  { path: "/pricing", heading: "Pricing" },
  { path: "/privacy", heading: "Privacy" },
  { path: "/terms", heading: "Terms of use" },
  { path: "/signup", heading: "Create your account" },
  { path: "/login", heading: "Log in" },
];

for (const { path, heading } of PAGES) {
  test(`${path} renders with one h1 and no console errors`, async ({ page }) => {
    const errors = trackErrors(page);
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    await expect(page.locator("h1")).toHaveCount(1);
    // No horizontal scrolling on any viewport.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}

test("the sample question can be answered and explains the answer", async ({ page }) => {
  await page.goto("/");
  const card = page.getByRole("region", { name: /aerobic respiration/i });
  await card.getByRole("button", { name: /Mitochondria/ }).click();
  await expect(card.getByText("That's right.")).toBeVisible();
  await expect(card.getByText(/release energy from glucose/)).toBeVisible();
  // Options lock after answering.
  await expect(card.getByRole("button", { name: /Nucleus/ })).toBeDisabled();
  await card.getByRole("button", { name: "Try another" }).click();
  await expect(page.getByRole("region", { name: /Priya/ })).toBeVisible();
});

test("a wrong answer is marked with words, not just colour", async ({ page }) => {
  await page.goto("/");
  const card = page.getByRole("region", { name: /aerobic respiration/i });
  await card.getByRole("button", { name: /Nucleus/ }).click();
  await expect(card.getByText("Not this time.")).toBeVisible();
  await expect(card.getByText("Not quite")).toBeVisible();
  await expect(card.getByText(/Correct answer/)).toBeAttached();
});

test("explanation levels switch", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Simpler" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("smell spreading");
});

test("signed-out visitors are sent from the app to log in", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("unknown pages show a helpful 404", async ({ page }) => {
  const response = await page.goto("/definitely-not-a-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("That page doesn't exist.");
});

test("mobile menu opens and navigates", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Pricing" }).click();
  await expect(page).toHaveURL(/\/pricing$/);
});
