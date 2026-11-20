import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("splits on commas and joins with newlines", async () => {
  await expect(runOp("split", "first,second")).resolves.toBe("first\nsecond");
});

it("preserves empty input", async () => {
  await expect(runOp("split", "")).resolves.toBe("");
});
