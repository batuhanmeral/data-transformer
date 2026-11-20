import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("decodes the known vector", async () => {
  await expect(runOp("from-decimal", "65 66", {})).resolves.toEqual(new Uint8Array([65, 66]));
});

it("decodes empty input", async () => {
  await expect(runOp("from-decimal", "", {})).resolves.toEqual(new Uint8Array([]));
});

it("rejects malformed input", async () => {
  await expect(runOp("from-decimal", "256", {})).rejects.toThrow(/invalid/i);
});
