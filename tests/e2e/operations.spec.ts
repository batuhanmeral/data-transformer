import { expect, test } from "@playwright/test";

test("palette adds operation", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press(process.platform === "darwin" ? "Meta+k" : "Control+k");
  const input = page.getByRole("combobox", { name: "Search commands" });
  await expect(input).toBeFocused();
  await input.fill("base64");
  await input.press("Enter");
  await expect(page.getByRole("dialog", { name: "Command palette" })).toBeHidden();
  await expect(page.getByRole("region", { name: "Recipe", exact: true })).toContainText("To Base64");
});

test("catalog searches descriptions and adds a favorite with Enter", async ({ page }) => {
  await page.goto("/");
  const catalog = page.getByRole("region", { name: "Operations" });
  const search = catalog.getByRole("searchbox", { name: "Search operations" });
  await expect(search).toBeVisible();
  await search.fill("URL-SAFE");
  await expect(catalog.getByRole("button", { name: "Add To Base64" })).toBeHidden();
  await catalog.getByRole("button", { name: "Favorite From Base64" }).click();
  await search.clear();
  const favorites = catalog.getByRole("region", { name: "Favorites" });
  await expect(favorites).toBeVisible();
  await favorites.getByRole("button", { name: "Add From Base64" }).press("Enter");
  await expect(page.getByRole("region", { name: "Recipe", exact: true })).toContainText("From Base64");
});

test("drags a catalog operation into the recipe", async ({ page }) => {
  await page.goto("/");
  const handle = page.getByRole("button", { name: "Drag To Base64" });
  await expect(handle).toBeVisible();
  await handle.scrollIntoViewIfNeeded();
  const recipe = page.getByRole("region", { name: "Recipe", exact: true });
  const from = await handle.boundingBox();
  const to = await recipe.boundingBox();
  if (!from || !to) throw new Error("Expected visible drag source and drop target.");
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(recipe).toContainText("To Base64");
});

test("category collapses and search expands", async ({ page }) => {
  await page.goto("/");
  const catalog = page.getByRole("region", { name: "Operations" });
  const category = catalog.getByRole("button", { name: "Encoding" });
  const operation = catalog.getByRole("button", { name: "Add From Base64" });
  await expect(category).toHaveAttribute("aria-expanded", "true");
  await category.press("Enter");
  await expect(category).toHaveAttribute("aria-expanded", "false");
  await expect(operation).toBeHidden();
  const search = catalog.getByRole("searchbox", { name: "Search operations" });
  await search.fill("URL-safe");
  await expect(operation).toBeVisible();
  await search.clear();
  await expect(operation).toBeHidden();
});
