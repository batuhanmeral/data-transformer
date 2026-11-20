import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("joins lines with a custom separator", async () => {
  await expect(runOp("join", "first\nsecond", {"joinWith": " | "})).resolves.toBe("first | second");
});

it("preserves empty input", async () => {
  await expect(runOp("join", "")).resolves.toBe("");
});
