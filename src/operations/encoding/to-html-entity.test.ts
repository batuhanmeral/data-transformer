import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("escapes markup delimiters", async () => {
  await expect(runOp("to-html-entity", "<a&>")).resolves.toBe("&lt;a&amp;&gt;");
});

it("encodes empty input", async () => {
  await expect(runOp("to-html-entity", "")).resolves.toBe("");
});
