import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("encodes the known vector", async () => {
  await expect(runOp("to-base58", "Hello World!", {})).resolves.toBe("2NEpo7TZRRrLZSi2U");
});

it("encodes empty input", async () => {
  await expect(runOp("to-base58", "", {})).resolves.toBe("");
});

it("preserves leading zero bytes", async () => {
  await expect(runOp("to-base58", new Uint8Array([0, 0, 1]))).resolves.toBe("112");
});
