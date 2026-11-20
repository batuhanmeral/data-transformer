import { expect, it } from "vitest";
import { runOp } from "../_test-utils";
import fromBase64 from "./from-base64";

it("decodes Base64 to the bytes for Hello", async () => {
  await expect(runOp("from-base64", "SGVsbG8=")).resolves.toEqual(Uint8Array.of(72, 101, 108, 108, 111));
});

it("decodes unpadded URL-safe Base64", async () => {
  await expect(runOp("from-base64", "_-8", { alphabet: "urlsafe" })).resolves.toEqual(Uint8Array.of(255, 239));
});

it("rejects invalid characters in strict mode", async () => {
  await expect(runOp("from-base64", "SGV@", { strict: true })).rejects.toThrow("Invalid Base64");
});

it("ignores invalid characters in permissive mode", async () => {
  await expect(runOp("from-base64", "SGVs bG8=@")).resolves.toEqual(Uint8Array.of(72, 101, 108, 108, 111));
});

it("decodes empty input to empty bytes", async () => {
  await expect(runOp("from-base64", "")).resolves.toEqual(new Uint8Array());
});

it("maps CyberChef's third position to strict mode", async () => {
  const args = fromBase64.cyberchef?.mapArgs(["A-Za-z0-9+/=", true, true]);
  await expect(runOp("from-base64", "SGV@", args)).rejects.toThrow("Invalid Base64");
});
