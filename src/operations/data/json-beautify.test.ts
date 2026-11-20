import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("indents valid JSON with two spaces", async () => {
  await expect(runOp("json-beautify", "{\"a\":[1,2]}")).resolves.toBe("{\n  \"a\": [\n    1,\n    2\n  ]\n}");
});

it("rejects empty JSON", async () => {
  await expect(runOp("json-beautify", "")).rejects.toThrow(/invalid JSON/i);
});

it("rejects malformed JSON", async () => {
  await expect(runOp("json-beautify", "{foo}")).rejects.toThrow(/invalid JSON/i);
});
