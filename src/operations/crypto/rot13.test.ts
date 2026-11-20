import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("rotates the Hello vector", async () => {
  await expect(runOp("rot13", "Hello")).resolves.toBe("Uryyb");
});

it("preserves empty input", async () => {
  await expect(runOp("rot13", "")).resolves.toBe("");
});
