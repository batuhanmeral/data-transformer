import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("encodes the known vector", async () => {
  await expect(runOp("to-binary", "A", {})).resolves.toBe("01000001");
});

it("encodes empty input", async () => {
  await expect(runOp("to-binary", "", {})).resolves.toBe("");
});
