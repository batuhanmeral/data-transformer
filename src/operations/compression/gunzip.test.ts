import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("decodes the known stream", async () => {
  await expect(runOp("gunzip", Uint8Array.from(atob("H4sIAAAAAAAAA8tIzcnJ5wIAIDA6NgYAAAA="), (char) => char.charCodeAt(0)))).resolves.toEqual(new Uint8Array([104, 101, 108, 108, 111, 10]));
});

it("decodes a valid stream containing empty data", async () => {
  await expect(runOp("gunzip", Uint8Array.from(atob("H4sIAAAAAAAAAwMAAAAAAAAAAAA="), (char) => char.charCodeAt(0)))).resolves.toEqual(new Uint8Array([]));
});

it("rejects missing compressed input", async () => {
  await expect(runOp("gunzip", new Uint8Array([]))).rejects.toThrow(/invalid/i);
});

it("rejects malformed compressed data", async () => {
  await expect(runOp("gunzip", new Uint8Array([0, 1, 2]))).rejects.toThrow(/invalid/i);
});

it("rejects a corrupted gzip checksum", async () => {
  await expect(runOp("gunzip", Uint8Array.from(atob("H4sIAAAAAAAAA8tIzcnJ5wIAIDA6NwYAAAA="), (char) => char.charCodeAt(0)))).rejects.toThrow(/gzip.*checksum/i);
});

it("decodes consecutive gzip members in order", async () => {
  const first = Uint8Array.from(atob("H4sIAAAAAAAAA8tIzcnJ5wIAIDA6NgYAAAA="), (char) => char.charCodeAt(0));
  const input = Uint8Array.of(...first, ...first);
  await expect(runOp("gunzip", input)).resolves.toEqual(new TextEncoder().encode("hello\nhello\n"));
});

it("rejects a gzip stream with a truncated footer", async () => {
  const input = Uint8Array.from(atob("H4sIAAAAAAAAA8tIzcnJ5wIAIDA6NgYAAA=="), (char) => char.charCodeAt(0));
  await expect(runOp("gunzip", input)).rejects.toThrow(/invalid gzip/i);
});
