import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";

/**
 * A teacher runs a class: create it, a student joins with the code, the teacher hosts a
 * class-only game on the board (without playing), and both see the class leaderboard.
 * Teacher accounts are set by the site owner, so the test marks one directly in the
 * local test database (CI only).
 */
test.skip(!process.env.E2E_WITH_SUPABASE || !process.env.E2E_DB_URL, "needs the local Supabase stack (CI)");

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

function makeTeacher(email: string) {
  execFileSync("psql", [
    process.env.E2E_DB_URL!,
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    `update public.profiles set account_type = 'teacher' where id = (select id from auth.users where email = '${email}')`,
  ]);
}

test("a teacher runs a class game for their students", async ({ page, browser }, testInfo) => {
  test.setTimeout(240_000);
  const project = testInfo.project.name;
  const teacher = page;
  const teacherErrors = crashesOn(teacher);
  const teacherEmail = `teacher-${run}-${project}@example.com`;
  await signUp(teacher, "Ms Teacher", teacherEmail);

  // Students can't create classes.
  await teacher.goto("/classes");
  await expect(teacher.getByRole("heading", { name: "Classes you teach" })).toHaveCount(0);

  makeTeacher(teacherEmail);
  await teacher.goto("/classes");
  await teacher.getByLabel("Class name").fill("Year 10 Physics");
  await teacher.getByRole("button", { name: "Create class" }).click();
  await expect(teacher).toHaveURL(/\/classes\/[0-9a-f-]{36}$/);
  const classUrl = teacher.url();
  const classCode = (await teacher.getByTestId("class-code").textContent())?.trim() ?? "";
  expect(classCode).toMatch(/^[BCDFGHJKMNPQRSTVWXZ2-9]{6}$/);

  // ── A student joins with the link ────────────────────────────────────────
  const studentContext = await browser.newContext();
  const student = await studentContext.newPage();
  const studentErrors = crashesOn(student);
  await signUp(student, "Class Student", `student-${run}-${project}@example.com`);
  await student.goto(`/classes?code=${classCode}`);
  await expect(student.getByLabel("Class code")).toHaveValue(classCode);
  await student.getByRole("button", { name: "Join class" }).click();
  await expect(student).toHaveURL(classUrl);
  await expect(student.getByRole("heading", { name: "Year 10 Physics" })).toBeVisible();
  await expect(student.getByText("No class game is open right now.")).toBeVisible();

  await teacher.reload();
  await expect(teacher.getByRole("row", { name: /Class Student/ })).toBeVisible();

  // ── Teacher hosts a class game ───────────────────────────────────────────
  await teacher.getByLabel("Questions from").selectOption({ label: "All of Physics" });
  await teacher.getByText("5", { exact: true }).click();
  await teacher.getByRole("button", { name: "Create class game" }).click();
  await expect(teacher).toHaveURL(/\/play\/[0-9a-f-]{36}$/);
  const gameUrl = teacher.url();
  await expect(teacher.getByText("Waiting for students to join.")).toBeVisible();

  await student.reload();
  await student.getByRole("button", { name: "Join game" }).click();
  await expect(student).toHaveURL(gameUrl);
  await expect(teacher.getByRole("heading", { name: /Students \(1\)/ })).toBeVisible({ timeout: 15_000 });
  await teacher.getByRole("button", { name: "Start game" }).click();

  for (let i = 1; i <= 5; i++) {
    await expect(student.getByText(`Question ${i} of 5`)).toBeVisible({ timeout: 15_000 });
    const first = student.getByRole("group", { name: "Answer options" }).getByRole("button").first();
    await expect(first).toBeEnabled({ timeout: 15_000 });
    // The teacher sees the question but can't answer it.
    await expect(teacher.getByText("Students answer on their own devices.")).toBeVisible();
    await expect(teacher.getByRole("group", { name: "Answer options" }).getByRole("button").first()).toBeDisabled();
    await first.click();
    await expect(teacher.getByText(/^Answer:/)).toBeVisible({ timeout: 15_000 });
    if (i < 5) await teacher.getByRole("button", { name: "Next question" }).click();
  }

  await student.getByRole("button", { name: "See final results" }).click();
  await expect(student.getByText("You finished 1st of 1")).toBeVisible();
  await teacher.getByRole("button", { name: "See final results" }).click();
  await expect(teacher.getByRole("heading", { name: "Final results" })).toBeVisible();
  await expect(teacher.getByText(/You finished/)).toHaveCount(0);

  // ── Class leaderboard and the teacher's overview ─────────────────────────
  await student.goto(classUrl);
  await expect(student.getByRole("heading", { name: "Class leaderboard" })).toBeVisible();
  await expect(student.getByText("Class Student (you)")).toBeVisible();
  await teacher.goto(classUrl);
  await expect(teacher.getByRole("row", { name: /Class Student/ })).toBeVisible();

  // ── An outsider can't see the class ──────────────────────────────────────
  const outsiderContext = await browser.newContext();
  const outsider = await outsiderContext.newPage();
  await signUp(outsider, "Not In Class", `outsider-class-${run}-${project}@example.com`);
  await outsider.goto(classUrl);
  await expect(outsider.getByRole("heading", { name: "We couldn't find that." })).toBeVisible();

  // ── The student leaves ───────────────────────────────────────────────────
  await student.goto(classUrl);
  await student.getByRole("button", { name: "Leave this class" }).click();
  await expect(student).toHaveURL(/\/classes\?left=1/);
  await expect(student.getByText("You haven't joined a class yet.")).toBeVisible();

  expect(teacherErrors).toEqual([]);
  expect(studentErrors).toEqual([]);
  await outsiderContext.close();
  await studentContext.close();
});
