import { defineConfig, devices } from "@playwright/test";

const url = "http://127.0.0.1:4173";
// Long-task timing is skewed by CPU contention from parallel browsers, so perf runs alone.
const perfTests = /perf\.spec\.ts$/;

export default defineConfig({
  testDir: "./tests/e2e",
  // A committed test.only would otherwise turn CI green on a partial run.
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { ...devices["Desktop Chrome"], baseURL: url, trace: "retain-on-failure" },
  projects: [
    { name: "e2e", testIgnore: perfTests },
    { name: "perf", testMatch: perfTests, dependencies: ["e2e"] },
  ],
  webServer: {
    command: "tsx tests/e2e/serve.ts",
    url,
  },
});
