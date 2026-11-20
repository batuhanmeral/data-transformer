import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("sorts numbers numerically", async () => {
  await expect(runOp("sort", "10\n2\n1", {"order": "numeric"})).resolves.toBe("1\n2\n10");
});

it("sorts by descending length", async () => {
  await expect(runOp("sort", "x,bbb,zz", {"delimiter": ",", "order": "length", "reverse": true})).resolves.toBe("bbb,zz,x");
});

it("preserves empty input", async () => {
  await expect(runOp("sort", "")).resolves.toBe("");
});
