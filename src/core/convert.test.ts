import { describe, expect, it } from "vitest";
import { convert, ConversionError, decodeUtf8Lossy, fromBytes, toBytes } from "./convert";
import type { DataValueMap } from "./types";

describe("convert", () => {
  it("roundtrips utf8", () => {
    const input = "ğüş€😀";
    const bytes = convert(input, "string", "bytes");
    expect(bytes).toEqual(Uint8Array.of(0xc4, 0x9f, 0xc3, 0xbc, 0xc5, 0x9f, 0xe2, 0x82, 0xac, 0xf0, 0x9f, 0x98, 0x80));
    expect(convert(bytes, "bytes", "string")).toBe(input);
  });

  it("decodes invalid utf8 lossily", () => {
    expect(decodeUtf8Lossy(Uint8Array.of(0xff, 0x41))).toBe("�A");
  });

  it("string to number rejects NaN", () => {
    expect(() => convert("no number", "string", "number")).toThrow(ConversionError);
  });

  it("string to json rejects invalid", () => {
    expect(() => convert("{broken", "string", "json")).toThrow(ConversionError);
  });

  it("json to string is pretty printed", () => {
    expect(convert({ a: 1 }, "json", "string")).toBe('{\n  "a": 1\n}');
  });

  const examples: DataValueMap = {
    bytes: Uint8Array.of(0xff, 0x41),
    string: "\ufeffğüş€😀",
    number: -12.5,
    json: { a: [1, null] },
    html: "<strong>hello</strong>",
  };

  it.each(Object.entries(examples) as [keyof DataValueMap, unknown][])(
    "roundtrips %s through toBytes and fromBytes",
    (type, value) => {
      expect(fromBytes(toBytes(value, type), type)).toEqual(value);
    },
  );
});
