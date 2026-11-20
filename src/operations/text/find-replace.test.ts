import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("replaces regex captures", async () => {
  await expect(runOp("find-replace", "a1b22", {"find": "(\\d+)", "replace": "<$1>", "mode": "regex"})).resolves.toBe("a<1>b<22>");
});

it("preserves empty input", async () => {
  await expect(runOp("find-replace", "")).resolves.toBe("");
});

it("treats pattern and replacement literally in simple mode", async () => {
  await expect(runOp("find-replace", "A. a.", {"find": "a.", "replace": "A$&", "mode": "simple", "global": false, "caseInsensitive": true})).resolves.toBe("A$& a.");
});

it("applies multiline anchors", async () => {
  await expect(runOp("find-replace", "foo\nfoo", {"find": "^foo$", "replace": "$", "multiline": true})).resolves.toBe("$\n$");
});

it("rejects invalid regex", async () => {
  await expect(runOp("find-replace", "xyz", {"find": "["})).rejects.toThrow(/regular expression/i);
});
