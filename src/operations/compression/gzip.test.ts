import { gunzipSync } from "node:zlib";
import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("compresses the reference text for an independent decoder", async () => {
  const compressed = await runOp("gzip", "hello\n") as Uint8Array;
  expect(gunzipSync(compressed).toString()).toBe("hello\n");
});

it("roundtrips through gunzip", async () => {
  const compressed = await runOp("gzip", "roundtrip 🎉", { level: 0 });
  await expect(runOp("gunzip", compressed)).resolves.toEqual(new TextEncoder().encode("roundtrip 🎉"));
});

it("produces a valid stream for empty input", async () => {
  const compressed = await runOp("gzip", "") as Uint8Array;
  expect(gunzipSync(compressed)).toHaveLength(0);
});
