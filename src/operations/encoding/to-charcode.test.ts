import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("encodes the known vector", async () => {
  await expect(runOp("to-charcode", "AB", {"base": 16})).resolves.toBe("41 42");
});

it("encodes empty input", async () => {
  await expect(runOp("to-charcode", "", {"base": 16})).resolves.toBe("");
});
