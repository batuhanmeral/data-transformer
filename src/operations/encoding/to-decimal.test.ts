import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("encodes the known vector", async () => {
  await expect(runOp("to-decimal", "AB", {})).resolves.toBe("65 66");
});

it("encodes empty input", async () => {
  await expect(runOp("to-decimal", "", {})).resolves.toBe("");
});
