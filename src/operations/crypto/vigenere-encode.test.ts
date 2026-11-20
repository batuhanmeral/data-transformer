import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("encodes HELLO with KEY", async () => {
  await expect(runOp("vigenere-encode", "HELLO", {"key": "KEY"})).resolves.toBe("RIJVS");
});

it("preserves empty input", async () => {
  await expect(runOp("vigenere-encode", "")).resolves.toBe("");
});

it("preserves case and skips punctuation", async () => {
  await expect(runOp("vigenere-encode", "He, llo!", {"key": "KEY"})).resolves.toBe("Ri, jvs!");
});
