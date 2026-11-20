import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("uppercases unicode text", async () => {
  await expect(runOp("to-upper-case", "Straße")).resolves.toBe("STRASSE");
});

it("preserves empty input", async () => {
  await expect(runOp("to-upper-case", "")).resolves.toBe("");
});
