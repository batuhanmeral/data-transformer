import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("retains the first occurrence in input order", async () => {
  await expect(runOp("unique", "a\nb\na")).resolves.toBe("a\nb");
});

it("preserves empty input", async () => {
  await expect(runOp("unique", "")).resolves.toBe("");
});
