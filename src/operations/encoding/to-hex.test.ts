import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("encodes the known vector", async () => {
  await expect(runOp("to-hex", "abc", {})).resolves.toBe("61 62 63");
});

it("encodes empty input", async () => {
  await expect(runOp("to-hex", "", {})).resolves.toBe("");
});
