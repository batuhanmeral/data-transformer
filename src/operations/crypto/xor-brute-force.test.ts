import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("produces no keys for empty input", async () => {
  await expect(runOp("xor-brute-force", "")).resolves.toBe("");
});

it("finds the printable flag for the reference key", async () => {
  const encrypted = Uint8Array.from([0x66, 0x6c, 0x61, 0x67], (byte) => byte ^ 0x2a);
  const output = await runOp("xor-brute-force", encrypted) as string;
  expect(output.split("\n")).toContain("key = 2a: flag");
});

it("limits previews to the specified sample and filters nonprintable results", async () => {
  const output = await runOp("xor-brute-force", Uint8Array.of(0, 0), { sampleLength: 1 }) as string;
  expect(output.split("\n")).toHaveLength(95);
  expect(output.split("\n")).toContain("key = 41: A");
});
