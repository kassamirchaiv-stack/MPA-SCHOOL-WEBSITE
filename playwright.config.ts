import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against a running production build:
 *   npm run build && npm run start -- -p 3100   (in another terminal)
 *   npm run test:e2e
 *
 * Admin tests create temporary accounts and test content in the configured
 * Supabase project and remove them afterwards (tests/e2e/admin-fixtures.ts).
 * Set E2E_ADMIN=0 to run only the public-site tests.
 */
export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  // The database is far away (us-west-2); allow time for server round trips.
  expect: { timeout: 20_000 },
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100", reducedMotion: "reduce" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: /admin\.spec\.ts/ },
  ],
});
