import { existsSync, readFileSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Load .env.local (gitignored) the same way Next.js does, so tests/e2e/helpers/supabase.ts and the
// admin-publish test see NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / PLAYWRIGHT_TEST_ADMIN_*
// without requiring them to be manually exported. In CI these are injected as real env vars instead,
// so a missing file here is a no-op, not an error.
const envPath = ".env.local";
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    const key = m?.[1];
    const value = m?.[2];
    if (key && value !== undefined && !(key in process.env)) process.env[key] = value.trim();
  }
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
