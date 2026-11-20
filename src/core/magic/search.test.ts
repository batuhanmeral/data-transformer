import { gzipSync } from "node:zlib";
import { expect, it, vi } from "vitest";
import { getOperation } from "../registry";
import { magic } from "./search";

const encode = (text: string) => new TextEncoder().encode(text);
const gzipBase64 = encode(gzipSync('{"a":1}').toString("base64"));

it("finds base64 -> gunzip chain", async () => {
  const [first] = await magic(gzipBase64);
  expect(first?.steps.map(({ opId }) => opId)).toEqual(["from-base64", "gunzip"]);
  expect(first?.preview).toContain('{"a":1}');
});

it("respects budget", async () => {
  const start = performance.now();
  await magic(gzipBase64, { budgetMs: 10 });
  expect(performance.now() - start).toBeLessThan(100);
  expect(await magic(gzipBase64, { budgetMs: 0 })).toEqual([]);
});

it("plain text yields no suggestions", async () => {
  expect(await magic(encode("This is ordinary plain text."))).toEqual([]);
});

it("respects depth and result limits", async () => {
  const nestedHex = encode("3438343834383438");
  const shallow = await magic(nestedHex, { depth: 1 });
  expect(shallow.map(({ preview }) => preview)).toEqual(["48484848"]);
  const limited = await magic(nestedHex, { maxResults: 1 });
  expect(limited.map(({ preview }) => preview)).toEqual(["HHHH"]);
});

it("suggests a decoding from a bounded sample of a large input", async () => {
  const [suggestion] = await magic(encode(btoa("A".repeat(12_000))));
  expect(suggestion?.steps.map(({ opId }) => opId)).toEqual(["from-base64"]);
  expect(suggestion?.preview).toBe("A".repeat(256));
});

it("stops when aborted during a pending decoder", async () => {
  vi.useFakeTimers();
  const decoder = vi.spyOn(getOperation("from-base64")!, "run").mockReturnValue(new Promise(() => {}));
  const controller = new AbortController();
  const options = { budgetMs: 500, signal: controller.signal };
  let suggestions: Awaited<ReturnType<typeof magic>> | undefined;
  try {
    const search = magic(gzipBase64, options).then((result) => { suggestions = result; });
    await vi.advanceTimersByTimeAsync(5);
    expect(decoder).toHaveBeenCalledOnce();
    setTimeout(() => controller.abort(), 0);
    await vi.advanceTimersByTimeAsync(20);

    expect(suggestions).toEqual([]);
    await search;
  } finally {
    decoder.mockRestore();
    vi.useRealTimers();
  }
});

it("yields so a scheduled abort can stop the remaining synchronous candidates", async () => {
  vi.useFakeTimers();
  const operation = getOperation("from-hex")!;
  const decode = operation.run;
  const controller = new AbortController();
  const decoder = vi.spyOn(operation, "run").mockImplementation((...args) => {
    setTimeout(() => controller.abort(), 0);
    return decode(...args);
  });
  const options = { budgetMs: 500, signal: controller.signal };
  try {
    const search = magic(encode("3438343834383438"), options);
    await vi.advanceTimersByTimeAsync(25);

    expect(decoder).toHaveBeenCalledOnce();
    expect((await search).map(({ preview }) => preview)).toEqual(["48484848"]);
  } finally {
    decoder.mockRestore();
    vi.useRealTimers();
  }
});
