import { expect, it } from "vitest";
import { getOperation } from "../registry";

const encode = (text: string) => new TextEncoder().encode(text);

it("detects base64", () => {
  const detect = getOperation("from-base64")?.magic?.detect;
  expect(detect?.(encode("SGVsbG8gd29ybGQ="))).toBeGreaterThan(0.5);
  expect(detect?.(encode("Hello world, how are you?"))).toBeLessThanOrEqual(0.5);
});

it.each([
  ["from-base32", encode("JBSWY3DP"), encode("Hello!")],
  ["from-hex", encode("48 65 6c 6c 6f"), encode("Hello!")],
  ["url-decode", encode("Hello%20world"), encode("Hello%xyz")],
  ["from-html-entity", encode("Tom &amp; Jerry"), encode("Tom & Jerry")],
  ["gunzip", Uint8Array.from(Buffer.from("H4sIAAAAAAACA6tWSlSyMqwFAK+sG1YHAAAA", "base64")), encode("Hello!")],
  ["zlib-inflate", Uint8Array.of(0x78, 0x9c, 1, 2, 3, 4), Uint8Array.of(0x78, 0, 1, 2, 3, 4)],
  ["raw-inflate", Uint8Array.of(1, 1, 0, 254, 255, 65), encode("Hello!")],
  ["jwt-decode", encode("eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0."), encode("foo.bar.baz")],
  ["from-binary", encode("01000001 01000010"), encode("12345678")],
  ["from-decimal", encode("72 101 108 108 111"), encode("72 300 108")],
] as const)("%s distinguishes its encoding from other data", (id, valid, invalid) => {
  const detect = getOperation(id)?.magic?.detect;
  expect(detect?.(valid)).toBeGreaterThan(0.5);
  expect(detect?.(invalid)).toBeLessThanOrEqual(0.5);
});
