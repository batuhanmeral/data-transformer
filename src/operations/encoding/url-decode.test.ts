import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("decodes reserved URL characters", async () => {
  await expect(runOp("url-decode", "a%20b%26c")).resolves.toBe("a b&c");
});

it("decodes empty input", async () => {
  await expect(runOp("url-decode", "")).resolves.toBe("");
});

it("rejects malformed escapes", async () => {
  await expect(runOp("url-decode", "%Q1")).rejects.toThrow(/invalid/i);
});
