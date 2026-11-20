import { expect, test } from "@playwright/test";

test("imports supported CyberChef steps after showing issues", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Input text" }).fill("Hello");
  await page.getByRole("button", { name: "Add From Hex" }).click();
  await page.getByRole("button", { name: "Open command palette" }).click();
  await page.getByRole("option", { name: "Import CyberChef recipe" }).click({ timeout: 2_000 });

  const dialog = page.getByRole("dialog", { name: "Import CyberChef recipe" });
  await dialog.getByRole("textbox", { name: "CyberChef recipe" }).fill("Unknown_Operation()To_Base64()");
  await dialog.getByRole("button", { name: "Import recipe", exact: true }).click();
  await expect(dialog.getByText("Unknown Operation: Unknown operation.")).toBeVisible();
  await dialog.getByRole("button", { name: "Import supported steps" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Select step 1: To Base64" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Select step .*From Hex/ })).toHaveCount(0);
  await expect(page.getByLabel("Output text")).toHaveText("SGVsbG8=");
});
