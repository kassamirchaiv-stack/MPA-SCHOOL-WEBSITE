import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end smoke tests against a running production build:
 *   npm run build && npm run start -- -p 3100   (in another terminal)
 *   npm run test:e2e
 */
export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100", reducedMotion: "reduce" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
