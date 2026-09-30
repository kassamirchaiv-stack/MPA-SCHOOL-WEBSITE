import { expect, test } from "@playwright/test";

const PAGES = ["/", "/about", "/about/campuses", "/programs", "/student-life", "/admissions", "/faq", "/news", "/events", "/gallery", "/contact", "/privacy"];

for (const path of PAGES) {
  test(`${path} renders with one h1 and no horizontal overflow`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
}

test("unknown page shows the 404 page", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /couldn’t find that page/i })).toBeVisible();
});

test("navigation works on this viewport", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) {
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog");
    await menu.getByRole("button", { name: "Admissions" }).click();
    await menu.getByRole("link", { name: "Frequently Asked Questions" }).click();
  } else {
    const nav = page.getByRole("navigation", { name: "Main" });
    await nav.getByRole("button", { name: "Admissions" }).focus();
    await page.keyboard.press("Enter");
    await nav.getByRole("link", { name: "Frequently Asked Questions" }).click();
  }
  await expect(page).toHaveURL(/\/faq$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Frequently Asked Questions/);
});

test("FAQ answers expand", async ({ page }) => {
  await page.goto("/faq");
  const first = page.locator("details").first();
  await first.locator("summary").click();
  await expect(first).toHaveAttribute("open", "");
});

test("contact form validates and submits", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Please enter your name")).toBeVisible();

  await page.getByLabel("Full name").fill("Playwright Test");
  await page.getByLabel("Email", { exact: true }).fill("e2e@example.com");
  await page.getByLabel("Subject").fill("Automated test message");
  await page.getByLabel("Message", { exact: true }).fill("This message was sent by the automated end-to-end test suite.");
  await page.waitForTimeout(3200); // the form rejects submissions faster than 3 s as spam
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("your message has been sent")).toBeVisible();
});
