import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
// CI builds first and tests the production server; locally the dev server is used.
const serverCommand = process.env.E2E_START === "production" ? "npm run start" : "npm run dev";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // multiplayer specs coordinate several browser contexts
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: serverCommand, url: baseURL, reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
