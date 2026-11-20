import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("encodes reserved URL characters", async () => {
  await expect(runOp("url-encode", "a b&c")).resolves.toBe("a%20b%26c");
});

it("encodes empty input", async () => {
  await expect(runOp("url-encode", "")).resolves.toBe("");
});
