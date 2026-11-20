import { inflateSync } from "node:zlib";
import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("compresses the reference text for an independent decoder", async () => {
  const compressed = await runOp("zlib-deflate", "hello\n") as Uint8Array;
  expect(inflateSync(compressed).toString()).toBe("hello\n");
});

it("roundtrips through zlib-inflate", async () => {
  const compressed = await runOp("zlib-deflate", "roundtrip 🎉", { level: 0 });
  await expect(runOp("zlib-inflate", compressed)).resolves.toEqual(new TextEncoder().encode("roundtrip 🎉"));
});

it("produces a valid stream for empty input", async () => {
  const compressed = await runOp("zlib-deflate", "") as Uint8Array;
  expect(inflateSync(compressed)).toHaveLength(0);
});
