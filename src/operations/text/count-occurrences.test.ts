import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("counts literal occurrences", async () => {
  await expect(runOp("count-occurrences", "banana", {"find": "a"})).resolves.toBe(3);
});

it("counts zero matches for empty input", async () => {
  await expect(runOp("count-occurrences", "", {"find": "a"})).resolves.toBe(0);
});

it("counts regex matches", async () => {
  await expect(runOp("count-occurrences", "v1 v22", {"find": "\\d+", "mode": "regex"})).resolves.toBe(2);
});

it("rejects invalid regex", async () => {
  await expect(runOp("count-occurrences", "xyz", {"find": "[", "mode": "regex"})).rejects.toThrow(/regular expression/i);
});
