import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("decodes the known vector", async () => {
  await expect(runOp("from-binary", "01000001", {})).resolves.toEqual(new Uint8Array([65]));
});

it("decodes empty input", async () => {
  await expect(runOp("from-binary", "", {})).resolves.toEqual(new Uint8Array([]));
});

it("rejects malformed input", async () => {
  await expect(runOp("from-binary", "01000002", {})).rejects.toThrow(/invalid/i);
});
