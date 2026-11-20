import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("XORs the known single-byte key vector", async () => {
  await expect(runOp("xor", "abc", {"key": "01", "keyEncoding": "hex"})).resolves.toEqual(new Uint8Array([96, 99, 98]));
});

it("preserves empty input", async () => {
  await expect(runOp("xor", "", {"key": "01", "keyEncoding": "hex"})).resolves.toEqual(new Uint8Array([]));
});

it("rejects invalid key encoding", async () => {
  await expect(runOp("xor", "abc", {"key": "gh", "keyEncoding": "hex"})).rejects.toThrow(/invalid.*hex/i);
});
