import { existsSync, globSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { operations } from "../operations/index.generated";
import { defaultArgs, getOperation, listOperations } from "./registry";

describe("operation registry", () => {
  it("every operation has a unique id", () => {
    expect(new Set(operations.map(({ id }) => id)).size).toBe(operations.length);
    expect(getOperation("to-base64")?.id).toBe("to-base64");
    expect(getOperation("missing")).toBeUndefined();
  });

  it("every operation has a sibling test file", () => {
    const files = globSync("src/operations/**/*.ts").filter(
      (file) => !/(?:^|[/\\])(?:_|index\.generated\.ts$)|\.test\.ts$/.test(file),
    );
    expect(files).toHaveLength(operations.length);
    for (const file of files) {
      expect(existsSync(file.replace(/\.ts$/, ".test.ts")), file).toBe(true);
    }
  });

  it("default args parse for every operation", () => {
    for (const { id, argsSchema } of listOperations()) {
      expect(argsSchema.safeParse(defaultArgs(id)).success, id).toBe(true);
    }
    expect(defaultArgs("from-base64")).toEqual({ alphabet: "standard", strict: false });
  });

  it("listOperations is sorted", () => {
    const metadata = listOperations();
    const sortKeys = metadata.map(({ category, name }) => `${category}/${name}`);
    expect(sortKeys).toEqual(sortKeys.toSorted((left, right) => left.localeCompare(right)));
    expect(metadata.map(({ id }) => id)).toContain("from-base64");
  });
});
