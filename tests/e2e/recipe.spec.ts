import { expect, test } from "@playwright/test";

test("reorder with keyboard", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add To Base64" }).click();
  await page.getByRole("button", { name: "Add From Base64" }).click();
  const recipe = page.getByRole("region", { name: "Recipe", exact: true });
  const second = recipe.getByRole("button", { name: "Select step 2: From Base64" });
  await expect(second).toBeVisible();
  await second.press("Alt+ArrowUp");
  await expect(recipe.getByRole("button", { name: "Select step 1: From Base64" })).toBeFocused();
});

test("disable step changes output", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Input text" }).fill("Hello");
  await page.getByRole("button", { name: "Add To Base64" }).click();
  const step = page.getByRole("button", { name: "Select step 1: To Base64" });
  await expect(step).toBeVisible();
  await page.getByRole("button", { name: "Bake", exact: true }).click();
  await expect(page.getByLabel("Output text")).toHaveText("SGVsbG8=");
  await step.press("d");
  await page.getByRole("button", { name: "Bake", exact: true }).click();
  await expect(page.getByLabel("Output text")).toHaveText("Hello");
  await expect(page.getByRole("region", { name: "Recipe", exact: true })).toContainText("Skipped");
});
