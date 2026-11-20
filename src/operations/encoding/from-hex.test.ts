import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("decodes the known vector", async () => {
  await expect(runOp("from-hex", "61 62 63", {})).resolves.toEqual(new Uint8Array([97, 98, 99]));
});

it("decodes empty input", async () => {
  await expect(runOp("from-hex", "", {})).resolves.toEqual(new Uint8Array([]));
});

it("rejects malformed input", async () => {
  await expect(runOp("from-hex", "0x6g", {})).rejects.toThrow(/invalid/i);
});

it("accepts hexadecimal prefixes and mixed separators", async () => {
  await expect(runOp("from-hex", "0x61:62 0X63")).resolves.toEqual(new Uint8Array([97, 98, 99]));
});
