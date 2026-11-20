import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("decodes the known vector", async () => {
  await expect(runOp("from-base58", "2NEpo7TZRRrLZSi2U", {})).resolves.toEqual(new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]));
});

it("decodes empty input", async () => {
  await expect(runOp("from-base58", "", {})).resolves.toEqual(new Uint8Array([]));
});

it("rejects malformed input", async () => {
  await expect(runOp("from-base58", "0OIl", {})).rejects.toThrow(/invalid/i);
});

it("preserves leading zero bytes", async () => {
  await expect(runOp("from-base58", "112")).resolves.toEqual(new Uint8Array([0, 0, 1]));
});
