import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { E2E_PREFIX, EDITOR, SUPER, readTheme, restoreTheme } from "./admin-fixtures";

test.skip(process.env.E2E_ADMIN === "0", "Admin tests disabled");
test.describe.configure({ mode: "serial", timeout: 120_000 });

async function signIn(page: Page, who: "super" | "editor") {
  const account = who === "super" ? SUPER : EDITOR;
  const password = who === "super" ? process.env.E2E_SUPER_PASSWORD! : process.env.E2E_EDITOR_PASSWORD!;
  await page.goto("/admin/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test("signed-out visitors are sent to the login page", async ({ page }) => {
  await page.goto("/admin/news", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fnews/);
});

test("wrong password is rejected", async ({ page }) => {
  await page.goto("/admin/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(SUPER.email);
  await page.getByLabel("Password").fill("definitely-not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Incorrect email or password.")).toBeVisible();
});

test("article lifecycle: draft → preview → publish → public → archive → delete", async ({ page, request }) => {
  const title = `${E2E_PREFIX} article ${Date.now()}`;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  await signIn(page, "super");

  await page.goto("/admin/news/new", { waitUntil: "networkidle" });
  await page.getByRole("textbox", { name: /^Title/ }).fill(title);
  await expect(page.getByRole("textbox", { name: /^Web address/ })).toHaveValue(slug);
  await page.getByRole("textbox", { name: /^Summary/ }).fill("Automated test summary.");
  await page.locator(".ProseMirror").click();
  await page.keyboard.type("Body written by the automated test.");
  await page.getByRole("button", { name: "Create article" }).click();
  await expect(page.getByText("Article created")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/news\/[a-z0-9]+$/);

  // Drafts are not public.
  expect((await request.get(`/news/${slug}`)).status()).toBe(200);
  expect(await (await request.get(`/news/${slug}`)).text()).toContain("find that page");

  // Preview renders the unpublished article in the public design.
  const previewHref = await page.getByRole("link", { name: "Preview" }).getAttribute("href");
  const preview = await page.context().newPage();
  await preview.goto(previewHref!, { waitUntil: "networkidle" });
  await expect(preview.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(preview.getByText("Body written by the automated test.")).toBeVisible();
  await preview.close();

  // Publish.
  await page.getByRole("combobox", { name: "Status" }).selectOption("PUBLISHED");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Article saved")).toBeVisible();

  await page.goto(`/news/${slug}`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await page.goto("/news", { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: title })).toBeVisible();

  // Archive from the list, then delete permanently.
  await page.goto(`/admin/news?q=${encodeURIComponent(title)}`);
  const row = page.getByRole("row", { name: new RegExp(title) });
  await row.getByLabel(`More actions for “${title}”`).click();
  await row.getByRole("button", { name: "Archive" }).click();
  await expect(row.getByText("Archived", { exact: true })).toBeVisible();
  expect(await (await request.get(`/news/${slug}`)).text()).toContain("find that page");

  await row.getByRole("button", { name: `Delete “${title}”` }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox").fill("delete");
  await dialog.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page.getByText("No articles match these filters.")).toBeVisible();
});

test("slug must be unique", async ({ page }) => {
  await signIn(page, "super");
  await page.goto("/admin/news/new", { waitUntil: "networkidle" });
  await page.getByRole("textbox", { name: /^Title/ }).fill(`${E2E_PREFIX} duplicate`);
  await page.getByRole("textbox", { name: /^Web address/ }).fill("registration-is-open"); // seeded article
  await page.getByRole("button", { name: "Create article" }).click();
  await expect(page.getByText("Already used — choose another")).toBeVisible();
});

test("FAQ: create, appears publicly, delete", async ({ page }) => {
  const question = `${E2E_PREFIX} question ${Date.now()}?`;
  await signIn(page, "super");
  await page.goto("/admin/faqs", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "New question" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Question").fill(question);
  await dialog.getByLabel("Answer").fill("An automated answer.");
  await dialog.getByLabel("Category").fill("Testing");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("FAQ saved")).toBeVisible();

  await page.goto("/faq", { waitUntil: "networkidle" });
  await expect(page.getByText(question)).toBeVisible();

  await page.goto("/admin/faqs", { waitUntil: "networkidle" });
  const row = page.getByRole("row", { name: new RegExp(question.replace(/[?]/g, "\\?")) });
  await row.getByRole("button", { name: `Delete “${question}”` }).click();
  await page.getByRole("dialog").getByRole("textbox").fill("delete");
  await page.getByRole("dialog").getByRole("button", { name: "Delete permanently" }).click();
  await expect(page.getByRole("row", { name: new RegExp(question.replace(/[?]/g, "\?")) })).toHaveCount(0);
});

test("media: upload an image, edit alt text, delete", async ({ page }) => {
  await signIn(page, "super");
  await page.goto("/admin/media", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Upload files" }).click();
  // 2×2 PNG generated in memory.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDK+mmyQAAAABJRU5ErkJggg==",
    "base64",
  );
  await page.locator('input[type="file"]').setInputFiles({ name: "e2e-pixel.png", mimeType: "image/png", buffer: png });
  await expect(page.getByText("e2e-pixel.png")).toBeVisible();
  await expect(page.locator("li", { hasText: "e2e-pixel.png" }).locator("svg.text-emerald-600")).toBeVisible({ timeout: 30_000 });

  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: /e2e-pixel/ }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Alt text").fill("A test pixel");
  await dialog.getByLabel("Name").fill(`${E2E_PREFIX} pixel`);
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("File details saved")).toBeVisible();

  await page.getByRole("button", { name: new RegExp(`${E2E_PREFIX} pixel`) }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  const confirm = page.getByRole("dialog", { name: "Delete this file permanently?" });
  await confirm.getByRole("textbox").fill("delete");
  await confirm.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page.getByText("File deleted")).toBeVisible();
});

test("theme change is applied to the public site", async ({ page }) => {
  const original = await readTheme();
  try {
    await signIn(page, "super");
    await page.goto("/admin/theme", { waitUntil: "networkidle" });
    await page.getByLabel("Primary", { exact: true }).fill("#7a1f5c");
    await page.getByRole("button", { name: "Save theme" }).click();
    await expect(page.getByText("Theme saved")).toBeVisible();
    await page.goto("/", { waitUntil: "networkidle" });
    const primary = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim());
    expect(primary).toBe("#7a1f5c");
  } finally {
    await restoreTheme(original);
    // Re-save through the app so the public cache is refreshed with the original colour.
    await page.goto("/admin/theme", { waitUntil: "networkidle" });
    await page.getByLabel("Primary", { exact: true }).fill(original.colorPrimary);
    await page.getByRole("button", { name: "Save theme" }).click();
    await expect(page.getByText("Theme saved")).toBeVisible();
  }
});

test("contact message reaches the inbox and can be managed", async ({ page }) => {
  const subject = `${E2E_PREFIX} enquiry ${Date.now()}`;
  await page.goto("/contact", { waitUntil: "networkidle" });
  await page.getByLabel("Full name").fill("E2E Parent");
  await page.getByLabel("Email", { exact: true }).fill("parent@e2e.mpa-test.invalid");
  await page.getByLabel("Subject").fill(subject);
  await page.getByLabel("Message", { exact: true }).fill("This is an automated enquiry from the test suite.");
  await page.waitForTimeout(3200);
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("your message has been sent")).toBeVisible();

  await signIn(page, "super");
  await page.goto("/admin/messages", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: subject }).click();
  await expect(page.getByText("This is an automated enquiry")).toBeVisible();
  await page.getByRole("button", { name: "Mark as replied" }).click();
  await expect(page.getByText("Marked as replied")).toBeVisible();
});

test("an ADMIN cannot reach super-admin areas", async ({ page }) => {
  await signIn(page, "editor");
  // Hidden from the sidebar…
  await expect(page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Users" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Theme" })).toHaveCount(0);
  // …and refused by the server when visited directly.
  for (const path of ["/admin/users", "/admin/theme", "/admin/settings", "/admin/activity"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/admin\?denied=1$/);
    await expect(page.getByText("Your role does not have access to that section.")).toBeVisible();
  }
  // Content areas remain available.
  await page.goto("/admin/news", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1, name: "News" })).toBeVisible();
});

test("main admin screens pass accessibility checks", async ({ page }) => {
  await signIn(page, "super");
  for (const path of ["/admin", "/admin/news/new", "/admin/homepage", "/admin/media", "/admin/theme", "/admin/settings", "/admin/navigation"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${path} — ${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")})`)).toEqual([]);
  }
});

test("sign out ends the session", async ({ page }) => {
  await signIn(page, "super");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/admin\/login/);
});
