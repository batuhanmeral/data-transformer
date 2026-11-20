import { randomBytes } from "node:crypto";
import { deflateRawSync } from "node:zlib";
import { expect, it } from "vitest";
import type { Recipe } from "../types";
import { decodeShare, encodeShare, ShareError } from "./url-codec";

const recipe: Recipe = [
  { key: "local", opId: "to-base64", args: { alphabet: "urlsafe" }, enabled: false, breakpoint: true },
];

function packedRecipe(value: unknown): string {
  return deflateRawSync(JSON.stringify(value)).toString("base64url");
}

it("roundtrips recipe and input", async () => {
  const input = Uint8Array.of(0, 255, 128, 10);
  const encoded = await encodeShare({ recipe, input });
  expect(encoded).toMatchObject({ fragment: expect.stringMatching(/^v=1&r=[\w-]+&i=[\w-]+$/), inputIncluded: true });
  const decoded = await decodeShare(`#${encoded.fragment}`);
  expect(decoded).toEqual({
    recipe: [{ ...recipe[0], key: expect.any(String) }],
    input,
  });
  expect(decoded.recipe[0]?.key).not.toBe("local");
});

it("omits input over limit", async () => {
  const encoded = await encodeShare({ recipe, input: randomBytes(80 * 1024) });
  expect(encoded).toMatchObject({ fragment: expect.stringMatching(/^v=1&r=[\w-]+$/), inputIncluded: false });
  await expect(decodeShare(encoded.fragment)).resolves.toMatchObject({
    recipe: [{ ...recipe[0], key: expect.any(String) }],
  });
  expect((await decodeShare(encoded.fragment)).input).toBeUndefined();
});

it("uses the compressed input size for the limit", async () => {
  const input = new Uint8Array(80 * 1024);
  const encoded = await encodeShare({ recipe: [], input });
  expect(encoded.inputIncluded).toBe(true);
  await expect(decodeShare(encoded.fragment)).resolves.toMatchObject({ input });
});

it("rejects malformed fragment", async () => {
  for (const fragment of [
    "v=1",
    "v=1&r=%",
    "v=1&r=AA",
    "v=1&r=" + packedRecipe([{ opId: "to-base64", args: [], enabled: true, breakpoint: false }]),
    "v=1&r=" + packedRecipe([]) + "&i=AA",
  ]) {
    await expect(decodeShare(fragment), fragment).rejects.toBeInstanceOf(ShareError);
  }
});

it("rejects unknown version", async () => {
  await expect(decodeShare(`v=9&r=${packedRecipe([])}`)).rejects.toThrow(/unsupported.*version/i);
});

it("lists each unknown operation in the error", async () => {
  const value = ["unknown-alpha", "unknown-beta"].map((opId) => ({
    opId, args: {}, enabled: true, breakpoint: false,
  }));
  await expect(decodeShare(`v=1&r=${packedRecipe(value)}`))
    .rejects.toThrow(/unknown-alpha.*unknown-beta/);
});

it.each(["compressed", "expanded"])("rejects oversized recipe (%s)", async (limit) => {
  const compressed = limit === "compressed"
    ? deflateRawSync(" ".repeat(64 * 1024) + "[]", { level: 0 })
    : deflateRawSync(" ".repeat(1024 * 1024) + "[]");
  if (limit === "compressed") expect(compressed.length).toBeGreaterThan(64 * 1024);
  else expect(compressed.length).toBeLessThan(64 * 1024);

  await expect(decodeShare(`v=1&r=${compressed.toString("base64url")}`).then(() => "decoded"))
    .rejects.toMatchObject({ name: "ShareError", message: "Share link is too large." });
});

it("rejects input that inflates past limit", async () => {
  const input = deflateRawSync(new Uint8Array(16 * 1024 * 1024 + 1));
  expect(input.length).toBeLessThan(64 * 1024);
  await expect(decodeShare(`v=1&r=${packedRecipe([])}&i=${input.toString("base64url")}`).then(() => "decoded"))
    .rejects.toMatchObject({ name: "ShareError", message: "Share link is too large." });
});

it.each(["compressed", "expanded"])("rejects a share recipe that exceeds the %s encoding limit", async (limit) => {
  const alphabet = limit === "compressed" ? randomBytes(80 * 1024).toString("base64") : "a".repeat(1024 * 1024);
  const recipe: Recipe = [{ key: "local", opId: "to-base64", args: { alphabet }, enabled: true, breakpoint: false }];
  await expect(encodeShare({ recipe })).rejects.toMatchObject({ name: "ShareError", message: "Share link is too large." });
});

it("omits input over the expanded limit when creating a share", async () => {
  const input = new Uint8Array(16 * 1024 * 1024 + 1);
  const encoded = await encodeShare({ recipe: [], input });
  expect(encoded.inputIncluded).toBe(false);
  await expect(decodeShare(encoded.fragment)).resolves.toEqual({ recipe: [] });
});

it("accepts input exactly at the expanded limit", async () => {
  const input = new Uint8Array(16 * 1024 * 1024);
  input[0] = 1;
  input[input.length - 1] = 255;
  const encoded = await encodeShare({ recipe: [], input });
  expect(encoded.inputIncluded).toBe(true);
  const decoded = await decodeShare(encoded.fragment);
  expect(decoded.input).toHaveLength(input.length);
  expect(decoded.input?.[0]).toBe(1);
  expect(decoded.input?.at(-1)).toBe(255);
});
