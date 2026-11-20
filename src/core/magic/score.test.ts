import { expect, it } from "vitest";
import { readability } from "./score";

const encode = (text: string) => new TextEncoder().encode(text);

it("scores readable Unicode above binary data", () => {
  expect(readability(encode("Merhaba, dünya!\nこんにちは"))).toBeGreaterThan(0.7);
  expect(readability(Uint8Array.of(0, 0x80, 0xff, 1))).toBeLessThan(0.3);
  expect(readability(new Uint8Array())).toBe(0);
});

it("rewards valid structured data and recognizes compression signatures", () => {
  expect(readability(encode('{"a":1}'))).toBeGreaterThan(readability(encode('{"a":x}')));
  expect(readability(Uint8Array.of(0x1f, 0x8b, 8, 0))).toBeGreaterThan(readability(Uint8Array.of(0xff, 0x8b, 8, 0)));
  expect(readability(Uint8Array.of(0x78, 0x9c, 0, 0, 0, 0))).toBeGreaterThan(readability(Uint8Array.of(0x78, 0, 0, 0, 0, 0)));
  expect(readability(encode("eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0."))).toBeGreaterThan(readability(encode("exJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0.")));
});
