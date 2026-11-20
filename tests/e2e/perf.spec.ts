import { randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";

type LongTaskProbe = {
  stop(): number[];
};

test("10MB input keeps main thread responsive", async ({ page }) => {
  const size = 10 * 1024 * 1024;
  await page.goto("/");
  const autoBake = page.getByRole("switch", { name: "Auto-bake" });
  await expect(autoBake).toHaveAttribute("aria-checked", "true");
  await autoBake.click();
  await page.getByLabel("Input file", { exact: true }).setInputFiles({
    name: "benchmark.bin",
    mimeType: "application/octet-stream",
    buffer: randomBytes(size),
  });
  await expect(page.getByLabel("Input file hex preview")).toBeVisible();
  await page.getByRole("button", { name: "Add To Base64" }).click();
  await page.getByRole("button", { name: "Add From Base64" }).click();

  await page.evaluate(() => {
    const samples: number[] = [];
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) samples.push(entry.duration);
    });
    observer.observe({ type: "longtask" });
    const scope = window as unknown as { longTaskProbe: LongTaskProbe };
    scope.longTaskProbe = {
      stop() {
        for (const entry of observer.takeRecords()) samples.push(entry.duration);
        observer.disconnect();
        return samples;
      },
    };
  });

  await page.getByRole("button", { name: "Bake", exact: true }).click();
  const formattedSize = await page.evaluate((bytes) => `${bytes.toLocaleString()} B`, size);
  await expect(page.getByLabel("Output size")).toHaveText(formattedSize, { timeout: 15_000 });
  await expect(page.getByLabel("Output text")).toBeVisible();
  const durations = await page.evaluate(async () => {
    // Include work triggered by rendering the output, not just the worker rendezvous.
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return (window as unknown as { longTaskProbe: LongTaskProbe }).longTaskProbe.stop();
  });

  const overBudget = durations.filter((duration) => duration > 100);
  const maximum = Math.max(0, ...durations);
  console.log(`10MB bake: ${durations.length} long task(s), ${overBudget.length} over 100 ms, max ${maximum} ms.`);
  expect(overBudget.length, `Long task durations: ${durations.join(", ")} ms`).toBeLessThanOrEqual(process.env.CI ? 1 : 0);
  expect(maximum).toBeLessThanOrEqual(250);
});
