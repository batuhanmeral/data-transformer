import { gzipSync } from "node:zlib";
import { expect, test } from "@playwright/test";

test("magic suggestion applies recipe", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Input text" }).fill(gzipSync('{"a":1}').toString("base64"));

  const output = page.getByRole("region", { name: "Output" });
  const suggestion = output.getByRole("button", { name: "From Base64 → Gunzip", exact: true });
  await expect(suggestion).toBeVisible();
  await suggestion.click();

  const recipe = page.getByRole("region", { name: "Recipe", exact: true });
  await expect(recipe.getByRole("button", { name: "Select step 1: From Base64" })).toBeVisible();
  await expect(recipe.getByRole("button", { name: "Select step 2: Gunzip" })).toBeVisible();
  await expect(output.getByLabel("Output text")).toHaveText('{"a":1}');
  await expect(suggestion).toBeHidden();
});
