import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("encodes the known vector", async () => {
  await expect(runOp("to-base32", "foobar", {})).resolves.toBe("MZXW6YTBOI======");
});

it("encodes empty input", async () => {
  await expect(runOp("to-base32", "", {})).resolves.toBe("");
});
