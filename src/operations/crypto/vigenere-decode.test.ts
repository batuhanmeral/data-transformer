import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("decodes the known ciphertext", async () => {
  await expect(runOp("vigenere-decode", "RIJVS", {"key": "KEY"})).resolves.toBe("HELLO");
});

it("preserves empty input", async () => {
  await expect(runOp("vigenere-decode", "")).resolves.toBe("");
});

it("rejects invalid keys", async () => {
  await expect(runOp("vigenere-decode", "ABC", {"key": "123"})).rejects.toThrow(/key.*letters/i);
});
