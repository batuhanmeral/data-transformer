import { inflateRawSync } from "node:zlib";
import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("compresses the reference text for an independent decoder", async () => {
  const compressed = await runOp("raw-deflate", "hello\n") as Uint8Array;
  expect(inflateRawSync(compressed).toString()).toBe("hello\n");
});

it("roundtrips through raw-inflate", async () => {
  const compressed = await runOp("raw-deflate", "roundtrip 🎉", { level: 0 });
  await expect(runOp("raw-inflate", compressed)).resolves.toEqual(new TextEncoder().encode("roundtrip 🎉"));
});

it("produces a valid stream for empty input", async () => {
  const compressed = await runOp("raw-deflate", "") as Uint8Array;
  expect(inflateRawSync(compressed)).toHaveLength(0);
});
