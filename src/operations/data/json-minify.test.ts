import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("removes insignificant whitespace", async () => {
  await expect(runOp("json-minify", "{\n  \"a\": \"hello world\"\n}")).resolves.toBe("{\"a\":\"hello world\"}");
});

it("rejects empty JSON", async () => {
  await expect(runOp("json-minify", "")).rejects.toThrow(/invalid JSON/i);
});

it("rejects malformed JSON", async () => {
  await expect(runOp("json-minify", "[1,]")).rejects.toThrow(/invalid JSON/i);
});
