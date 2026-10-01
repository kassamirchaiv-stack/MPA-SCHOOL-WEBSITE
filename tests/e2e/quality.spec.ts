import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** Phase 7 quality checks for the public website. */

const PAGES = [
  "/",
  "/about",
  "/about/campuses",
  "/programs",
  "/programs/primary-education",
  "/student-life",
  "/admissions",
  "/faq",
  "/news",
  "/news/registration-is-open",
  "/events",
  "/gallery",
  "/contact",
  "/privacy",
];

test.describe("accessibility (axe, WCAG 2.1 AA)", () => {
  test.skip(({ isMobile }) => isMobile, "Run once, on desktop");
  for (const path of PAGES) {
    test(path, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")})`)).toEqual([]);
    });
  }
});

test.describe("responsive layout", () => {
  test.skip(({ isMobile }) => isMobile, "Widths are set explicitly");
  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
    test(`no horizontal scrolling at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of PAGES) {
        await page.goto(path, { waitUntil: "domcontentloaded" });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${path} overflows by ${overflow}px at ${width}px`).toBeLessThanOrEqual(0);
      }
    });
  }
});

test("every internal link on the public site works", async ({ page, request, isMobile }) => {
  test.skip(isMobile, "Run once");
  test.setTimeout(180_000);
  const seen = new Set<string>();
  const queue = ["/"];
  const broken: string[] = [];
  while (queue.length > 0 && seen.size < 150) {
    const path = queue.shift()!;
    if (seen.has(path)) continue;
    seen.add(path);
    const head = await request.head(path);
    if (!(head.headers()["content-type"] ?? "").includes("text/html")) {
      if (head.status() >= 400) broken.push(`${path} (${head.status()})`);
      continue;
    }
    const response = await page.goto(path, { waitUntil: "networkidle" });
    const notFound = await page.getByRole("heading", { level: 1, name: /couldn’t find that page/i }).count();
    if ((response?.status() ?? 0) >= 400 || notFound > 0) {
      broken.push(`${path} (${response?.status()})`);
      continue;
    }
    const links = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
    for (const href of links) {
      if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/admin")) continue;
      const clean = href.split("#")[0];
      if (clean && !seen.has(clean)) queue.push(clean);
    }
  }
  expect(broken, `Broken links found after crawling ${seen.size} pages`).toEqual([]);
});
