import { expect, test } from "@playwright/test";

test("renders three panels on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Operations", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Recipe", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Input", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Output", exact: true })).toBeVisible();
});

test("shows tabs on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("tab", { name: "Input", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: "Recipe", exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Output", exact: true }).click();
  await expect(page.getByRole("region", { name: "Output", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Input text" })).toBeHidden();
});

test("theme toggle switches class", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await page.getByRole("button", { name: "Toggle theme" }).click();
  await expect(page.locator("html")).toHaveClass(/\blight\b/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/\blight\b/);
});

test("no csp violations under production headers", async ({ page }) => {
  const violations: string[] = [];
  await page.exposeFunction("recordViolation", (message: string) => violations.push(message));
  await page.addInitScript(() => {
    const collector = window as unknown as { recordViolation(message: string): void };
    window.addEventListener("securitypolicyviolation", (event) => {
      collector.recordViolation(`${event.violatedDirective} ${event.blockedURI}`);
    });
  });
  page.on("console", (message) => {
    if (/content security policy/i.test(message.text())) violations.push(message.text());
  });
  page.on("pageerror", (error) => violations.push(error.message));

  const response = await page.goto("/");
  expect(response?.headers()["content-security-policy"]).toContain("default-src 'none'");
  await page.getByRole("textbox", { name: "Input text" }).fill("Hello");
  await page.getByRole("button", { name: "Bake", exact: true }).click();
  await expect(page.getByLabel("Output text")).toHaveText("Hello");
  expect(violations).toEqual([]);
});

const expectPlacement = expect.configure({ soft: true, timeout: 1_000 });

for (const { name, width, height } of [
  { name: "desktop", width: 1280, height: 720 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`moves workspace controls into panels on ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const workspace = page.getByRole("main", { name: "Data workspace" });

    await expectPlacement(page.getByRole("banner")).toHaveCount(0);
    await expectPlacement(page.getByRole("contentinfo", { name: "Workspace status" })).toHaveCount(0);
    await expectPlacement(page.getByRole("heading", { level: 1, name: "Unravel" })).toHaveClass(/sr-only/);

    if (name === "mobile") {
      const tablist = workspace.getByRole("tablist", { name: "Workspace panels" });
      const navigation = tablist.locator("..");
      await expectPlacement(navigation.getByRole("button", { name: "Open operations", exact: true })).toBeVisible();
      await expectPlacement(navigation.getByRole("button", { name: "Open command palette", exact: true })).toBeVisible();
      await tablist.getByRole("tab", { name: "Recipe", exact: true }).click();
    } else {
      const operationsHeader = workspace.getByRole("region", { name: "Operations", exact: true }).locator("header");
      await expectPlacement(operationsHeader.getByRole("button", { name: "Open command palette", exact: true })).toBeVisible();
      await expectPlacement(operationsHeader.getByRole("button", { name: "Toggle theme", exact: true })).toBeVisible();
    }

    const recipeHeader = workspace.getByRole("region", { name: "Recipe", exact: true }).locator("header");
    await expectPlacement(recipeHeader.getByRole("switch", { name: "Auto-bake", exact: true })).toBeVisible();
    await expectPlacement(recipeHeader.getByRole("button", { name: "Bake", exact: true })).toBeVisible();
  });
}

test("serves third-party notices with the static export", async ({ request }) => {
  const response = await request.get("/THIRD-PARTY-NOTICES.txt");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/plain");
  const text = await response.text();
  for (const name of ["react 19", "next 16", "lucide-react", "@fontsource-variable/inter", "tailwindcss"]) {
    expect(text).toContain(name);
  }
});
