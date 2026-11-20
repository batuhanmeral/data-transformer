import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("rotates the Hello vector", async () => {
  await expect(runOp("rot47", "Hello")).resolves.toBe("w6==@");
});

it("preserves empty input", async () => {
  await expect(runOp("rot47", "")).resolves.toBe("");
});
