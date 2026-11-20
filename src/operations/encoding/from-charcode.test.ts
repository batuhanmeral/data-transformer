import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("decodes the known vector", async () => {
  await expect(runOp("from-charcode", "41 42", {"base": 16})).resolves.toBe("AB");
});

it("decodes empty input", async () => {
  await expect(runOp("from-charcode", "", {"base": 16})).resolves.toBe("");
});

it("rejects malformed input", async () => {
  await expect(runOp("from-charcode", "4z", {"base": 16})).rejects.toThrow(/invalid/i);
});
