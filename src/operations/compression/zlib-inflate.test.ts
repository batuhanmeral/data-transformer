import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("decodes the known stream", async () => {
  await expect(runOp("zlib-inflate", Uint8Array.from(atob("eJzLSM3JyecCAAhLAh8="), (char) => char.charCodeAt(0)))).resolves.toEqual(new Uint8Array([104, 101, 108, 108, 111, 10]));
});

it("decodes a valid stream containing empty data", async () => {
  await expect(runOp("zlib-inflate", Uint8Array.from(atob("eJwDAAAAAAE="), (char) => char.charCodeAt(0)))).resolves.toEqual(new Uint8Array([]));
});

it("rejects missing compressed input", async () => {
  await expect(runOp("zlib-inflate", new Uint8Array([]))).rejects.toThrow(/invalid/i);
});

it("rejects malformed compressed data", async () => {
  await expect(runOp("zlib-inflate", new Uint8Array([0, 1, 2]))).rejects.toThrow(/invalid/i);
});

it("rejects a corrupted zlib checksum", async () => {
  await expect(runOp("zlib-inflate", Uint8Array.from(atob("eJzLSM3JyecCAAhLAh4="), (char) => char.charCodeAt(0)))).rejects.toThrow(/zlib.*checksum/i);
});
