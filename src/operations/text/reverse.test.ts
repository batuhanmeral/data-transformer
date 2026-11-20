import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("reverses characters", async () => {
  await expect(runOp("reverse", "abc")).resolves.toEqual(new Uint8Array([99, 98, 97]));
});

it("preserves supplementary Unicode characters", async () => {
  await expect(runOp("reverse", "a😀")).resolves.toEqual(new Uint8Array([240, 159, 152, 128, 97]));
});

it("reverses raw bytes without decoding", async () => {
  await expect(runOp("reverse", new Uint8Array([0, 255, 128]), {"mode": "byte"})).resolves.toEqual(new Uint8Array([128, 255, 0]));
});

it("reverses lines", async () => {
  await expect(runOp("reverse", "first\nsecond", {"mode": "line"})).resolves.toEqual(new Uint8Array([115, 101, 99, 111, 110, 100, 10, 102, 105, 114, 115, 116]));
});

it("preserves empty input", async () => {
  await expect(runOp("reverse", "")).resolves.toEqual(new Uint8Array([]));
});
