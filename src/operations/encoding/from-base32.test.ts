import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("decodes the known vector", async () => {
  await expect(runOp("from-base32", "MZXW6YTBOI======", {})).resolves.toEqual(new Uint8Array([102, 111, 111, 98, 97, 114]));
});

it("decodes empty input", async () => {
  await expect(runOp("from-base32", "", {})).resolves.toEqual(new Uint8Array([]));
});

it("rejects malformed input", async () => {
  await expect(runOp("from-base32", "MZXW6Y!BOI======", {})).rejects.toThrow(/invalid/i);
});

it("rejects invalid padding", async () => {
  await expect(runOp("from-base32", "MY====")).rejects.toThrow(/invalid/i);
});

it("rejects nonzero trailing bits", async () => {
  await expect(runOp("from-base32", "MZ======")).rejects.toThrow(/invalid/i);
});
