import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("lowercases unicode text", async () => {
  await expect(runOp("to-lower-case", "CAFÉ")).resolves.toBe("café");
});

it("preserves empty input", async () => {
  await expect(runOp("to-lower-case", "")).resolves.toBe("");
});
