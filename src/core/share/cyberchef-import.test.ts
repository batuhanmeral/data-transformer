import { expect, it } from "vitest";
import { importCyberChef } from "./cyberchef-import";

it("imports chef json", () => {
  const result = importCyberChef('[{"op":"To Base64","args":["A-Za-z0-9-_"]},{"op":"Split","args":[]}]');
  expect(result).toEqual({
    recipe: [
      {
        key: expect.any(String), opId: "to-base64", args: { alphabet: "urlsafe" },
        enabled: true, breakpoint: false,
      },
      {
        key: expect.any(String), opId: "split", args: { delimiter: ",", joinWith: "\n" },
        enabled: true, breakpoint: false,
      },
    ],
    issues: [],
  });
  expect(result.recipe[0]?.key).not.toBe(result.recipe[1]?.key);
});

it("imports compact format", () => {
  const result = importCyberChef("XOR({'option':'Hex','string':'aa,bb'},'Standard',false)SHA2(256,64,160)");
  expect(result.issues).toEqual([]);
  expect(result.recipe).toMatchObject([
    { opId: "xor", args: { key: "aa,bb", keyEncoding: "hex", scheme: "standard" } },
    { opId: "sha2", args: { variant: 256 } },
  ]);
});

it("imports url-encoded compact", () => {
  const partlyEncoded = "To_Base64('A-Za-z0-9%2B/%3D')From_Hex('Space')";
  const fullyEncoded = encodeURIComponent("From_Base64('A-Za-z0-9+/=',true,false)From_Hex('Space')");
  expect(importCyberChef(partlyEncoded)).toMatchObject({
    recipe: [
      { opId: "to-base64", args: { alphabet: "standard" } },
      { opId: "from-hex", args: { delimiter: " " } },
    ],
    issues: [],
  });
  expect(importCyberChef(fullyEncoded)).toMatchObject({
    recipe: [
      { opId: "from-base64", args: { alphabet: "standard", strict: false } },
      { opId: "from-hex", args: { delimiter: " " } },
    ],
    issues: [],
  });
});

it("reports unknown operation as issue", () => {
  const result = importCyberChef("Not_An_Operation('unused')To_Base64()");
  expect(result.recipe).toMatchObject([{ opId: "to-base64" }]);
  expect(result.issues).toEqual([{ op: "Not An Operation", message: expect.stringMatching(/unknown operation/i) }]);
});

it("keeps disabled and breakpoint flags", () => {
  const { recipe, issues } = importCyberChef('[{"op":"To Base64","args":[],"disabled":true,"breakpoint":true}]');
  expect(issues).toEqual([]);
  expect(recipe).toMatchObject([{ opId: "to-base64", enabled: false, breakpoint: true }]);
});

it("reports unsupported options and keeps other steps", () => {
  const { recipe, issues } = importCyberChef("To_Base64('unrecognized')URL_Decode()");
  expect(recipe).toMatchObject([{ opId: "url-decode" }]);
  expect(issues).toEqual([{ op: "To Base64", message: "Unsupported CyberChef Base64 alphabet." }]);
});

it("reports invalid recipe entries and malformed compact syntax", () => {
  expect(importCyberChef('[{"op":"To Base64","args":42},{"op":"From Hex","args":[]} ]')).toMatchObject({
    recipe: [{ opId: "from-hex" }],
    issues: [{ op: "To Base64", message: expect.stringMatching(/invalid.*step/i) }],
  });
  expect(importCyberChef("To_Base64('unterminated)")).toMatchObject({
    recipe: [],
    issues: [{ message: expect.stringMatching(/invalid.*recipe/i) }],
  });
});
