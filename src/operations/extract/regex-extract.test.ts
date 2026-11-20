import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("lists matches in input order and keeps duplicates by default", async () => {
  await expect(runOp("regex-extract", "a1 b22 a1", { pattern: "\\d+" })).resolves.toBe("1\n22\n1");
});

it("serializes unique capture group matches with the requested flags", async () => {
  await expect(runOp("regex-extract", "A1 a1 b2 a3", {
    pattern: "a(\\d)", flags: "gi", group: 1, outputFormat: "json", unique: true,
  })).resolves.toBe('["1","3"]');
});

it("uses only the first match without the global flag", async () => {
  await expect(runOp("regex-extract", "A1 a2", {
    pattern: "a\\d", flags: "i",
  })).resolves.toBe("A1");
});

it("skips unmatched capture groups and advances past zero-width matches", async () => {
  await expect(runOp("regex-extract", "a1 b a2", {
    pattern: "(?=a(\\d))|(?=b)", group: 1,
  })).resolves.toBe("1\n2");
});

it("returns an empty list for empty input", async () => {
  await expect(runOp("regex-extract", "", { pattern: "\\w+" })).resolves.toBe("");
  await expect(runOp("regex-extract", "", { pattern: "\\w+", outputFormat: "json" })).resolves.toBe("[]");
});

it("reports invalid patterns and flags", async () => {
  await expect(runOp("regex-extract", "x", { pattern: "[" })).rejects.toThrow(/invalid regular expression/i);
  await expect(runOp("regex-extract", "x", { pattern: "x", flags: "gg" })).rejects.toThrow(/invalid regular expression/i);
});
