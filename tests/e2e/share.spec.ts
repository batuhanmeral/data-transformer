import { deflateRawSync } from "node:zlib";
import { expect, test } from "@playwright/test";

test("shared link restores state", async ({ page, context }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Input text" }).fill("Hello share");
  await page.getByRole("button", { name: "Add To Base64" }).click();
  await page.getByRole("button", { name: "Open command palette" }).click();
  await page.getByRole("option", { name: "Share recipe" }).click({ timeout: 2_000 });
  const dialog = page.getByRole("dialog", { name: "Share recipe" });
  await dialog.getByRole("checkbox", { name: "Include input" }).check();
  await dialog.getByRole("button", { name: "Create link" }).click();
  const link = dialog.getByRole("textbox", { name: "Share link" });
  await expect(link).toHaveValue(/#v=1&r=[\w-]+&i=[\w-]+$/);

  const recipient = await context.newPage();
  await recipient.goto(await link.inputValue());
  await expect(recipient.getByRole("textbox", { name: "Input text" })).toHaveText("Hello share");
  await expect(recipient.getByRole("button", { name: "Select step 1: To Base64" })).toBeVisible();
  await expect(recipient.getByLabel("Output text")).toHaveText("SGVsbG8gc2hhcmU=");
});

test("fragment never sent to server", async ({ page, baseURL }) => {
  const input = "share-input-canary";
  const packedInput = deflateRawSync(input).toString("base64url");
  const packedRecipe = deflateRawSync("[]").toString("base64url");
  const requested: string[] = [];
  page.on("request", (request) => requested.push(request.url()));

  await page.goto(`/#v=1&r=${packedRecipe}&i=${packedInput}`);
  await expect(page.getByRole("textbox", { name: "Input text" })).toHaveText(input);
  await expect(page.getByLabel("Output text")).toHaveText(input);
  expect(requested).toContain(`${baseURL}/`);
  for (const url of requested) {
    expect(new URL(url).origin).toBe(baseURL);
    expect(url).not.toContain("#");
    expect(url).not.toContain(input);
    expect(url).not.toContain(packedInput);
    expect(url).not.toContain(packedRecipe);
  }
});

test("malformed share shows an error and opens an empty workspace", async ({ page }) => {
  await page.goto("/#v=1&r=invalid");
  await expect(page.getByText("Invalid share link.", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Input text" })).toHaveText("Type or paste text…");
  await expect(page.getByRole("button", { name: /^Select step / })).toHaveCount(0);
});
