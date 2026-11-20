import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("decodes the known stream", async () => {
  await expect(runOp("raw-inflate", Uint8Array.from(atob("y0jNycnnAgA="), (char) => char.charCodeAt(0)))).resolves.toEqual(new Uint8Array([104, 101, 108, 108, 111, 10]));
});

it("decodes a valid stream containing empty data", async () => {
  await expect(runOp("raw-inflate", Uint8Array.from(atob("AwA="), (char) => char.charCodeAt(0)))).resolves.toEqual(new Uint8Array([]));
});

it("rejects missing compressed input", async () => {
  await expect(runOp("raw-inflate", new Uint8Array([]))).rejects.toThrow(/invalid/i);
});

it("rejects malformed compressed data", async () => {
  await expect(runOp("raw-inflate", new Uint8Array([255]))).rejects.toThrow(/invalid/i);
});
