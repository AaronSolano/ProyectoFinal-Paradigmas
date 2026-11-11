import { defineConfig, devices } from "@playwright/test";

/**
 * E2E multijugador (1 host + 2 estudiantes). Requiere el stack levantado
 * (`./start.sh` / `start.ps1`, o `docker compose up -d`) con el web-client en E2E_BASE_URL.
 * Los navegadores se instalan con `pnpm exec playwright install chromium firefox`.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.spec\.ts/,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
});
