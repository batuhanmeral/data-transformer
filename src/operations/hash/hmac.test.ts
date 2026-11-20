import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("authenticates the Jefe vector", async () => {
  await expect(runOp("hmac", "what do ya want for nothing?", {"key": "Jefe", "hash": "sha256"})).resolves.toBe("5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843");
});

it("authenticates empty input", async () => {
  await expect(runOp("hmac", "")).resolves.toBe("b613679a0814d9ec772f95d778c35fc5ff1697c493715653c6c712144292c5ad");
});

it("accepts hexadecimal keys", async () => {
  await expect(runOp("hmac", "what do ya want for nothing?", {"key": "4a656665", "keyEncoding": "hex"})).resolves.toBe("5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843");
});

it("accepts Base64 keys", async () => {
  await expect(runOp("hmac", "what do ya want for nothing?", {"key": "SmVmZQ==", "keyEncoding": "base64"})).resolves.toBe("5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843");
});

it("rejects an invalid encoded key", async () => {
  await expect(runOp("hmac", "abc", {"key": "f", "keyEncoding": "hex"})).rejects.toThrow(/invalid.*hex/i);
});
