import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("base64 roundtrip shows output", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Input text" }).fill("Hello");
  await page.getByRole("button", { name: "Add To Base64" }).click();
  await page.getByRole("button", { name: "Add From Base64" }).click();
  await page.getByRole("button", { name: "Bake", exact: true }).click();
  await expect(page.getByLabel("Output text")).toHaveText("Hello");
  await page.getByRole("button", { name: "Select step 1: To Base64" }).click();
  await expect(page.getByLabel("Output text")).toHaveText("SGVsbG8=");
  await page.getByRole("button", { name: "Hex view" }).click();
  await expect(page.getByLabel("Hex data")).toContainText("53 47 56 73 62 47 38 3d");
});

test("bad base64 marks step error and app stays usable", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add From Base64" }).click();
  await page.getByRole("switch", { name: "Strict mode" }).click();
  const input = page.getByRole("textbox", { name: "Input text" });
  const alert = page.getByRole("region", { name: "Recipe", exact: true }).getByRole("alert");
  await input.fill("SGV@");
  await expect(alert).toHaveText("Invalid Base64 character.");
  await input.fill("SGVsbG8=");
  await expect(page.getByLabel("Output text")).toHaveText("Hello");
  await expect(alert).toBeHidden();
});

test("download matches bytes", async ({ page }) => {
  await page.goto("/");
  const bytes = Buffer.from([0, 0xff, 0x41, 0x80, 0, 7]);
  const input = page.getByLabel("Input file", { exact: true });
  await expect(input).toBeAttached();
  await input.setInputFiles({ name: "sample.bin", mimeType: "application/octet-stream", buffer: bytes });
  await expect(page.getByText("sample.bin", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add To Base64" }).click();
  await page.getByRole("button", { name: "Add From Base64" }).click();
  await page.getByRole("button", { name: "Bake", exact: true }).click();
  await expect(page.getByLabel("Output size")).toHaveText("6 B");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download output" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("output.bin");
  expect(await readFile(await file.path())).toEqual(bytes);
});

test("html output is sandboxed", async ({ page }) => {
  await page.context().route("**/turbopack-worker-*.js", (route) => route.fulfill({
    contentType: "text/javascript",
    body: `self.onmessage = ({ data }) => {
      if (data.type !== "run") return;
      const output = new TextEncoder().encode("<strong>Preview</strong>").buffer;
      self.postMessage({ type: "done", runId: data.runId, output, outputType: "html", totalMs: 0 }, [output]);
    };`,
  }));
  await page.goto("/");
  await page.getByRole("button", { name: "Bake", exact: true }).click();
  const preview = page.locator('iframe[title="HTML output"]');
  await expect(preview).toHaveAttribute("sandbox", "");
  await expect(preview.contentFrame().getByText("Preview")).toBeVisible();
});

test("hash and compression chain", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Input text" }).fill("hello");
  await page.getByRole("button", { name: "Add Gzip", exact: true }).click();
  await page.getByRole("button", { name: "Add Gunzip", exact: true }).click();
  await page.getByRole("button", { name: "Add SHA2", exact: true }).click();
  await expect(page.getByRole("spinbutton", { name: "Size (bits)" })).toHaveValue("256");
  await page.getByRole("button", { name: "Bake", exact: true }).click();
  await expect(page.getByRole("region", { name: "Recipe", exact: true }).getByText("OK", { exact: true })).toHaveCount(3);
  await expect(page.getByLabel("Output text")).toHaveText(
    "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
  );
});
