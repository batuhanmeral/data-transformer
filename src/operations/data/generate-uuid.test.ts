import { expect, it } from "vitest";
import { getOperation } from "../../core/registry";
import { runOp } from "../_test-utils";

it("generates an RFC-compatible UUID v4 from empty input", async () => {
  await expect(runOp("generate-uuid", "")).resolves.toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

it("generates a fresh UUID regardless of input", async () => {
  const first = await runOp("generate-uuid", "ignored input");
  const second = await runOp("generate-uuid", "ignored input");
  expect(first).not.toBe(second);
  expect(getOperation("generate-uuid")?.cacheable).toBe(false);
});

it("encodes the Unix millisecond timestamp and UUID v7 variant bits", async () => {
  const earliest = Date.now();
  const uuid = await runOp("generate-uuid", "", { version: "v7" }) as string;
  expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  const timestamp = Number.parseInt(uuid.replaceAll("-", "").slice(0, 12), 16);
  expect(timestamp).toBeGreaterThanOrEqual(earliest);
  expect(timestamp).toBeLessThanOrEqual(Date.now());
});
