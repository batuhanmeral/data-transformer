import { expect, it } from "vitest";
import { runOp } from "../_test-utils";
import { nistSp80038aAes128 } from "./_aes-vectors";

it("decrypts the NIST CBC ciphertext without padding", async () => {
  await expect(runOp("aes-decrypt", new Uint8Array([118, 73, 171, 172, 129, 25, 178, 70, 206, 233, 142, 155, 18, 233, 25, 125]), {"mode": "CBC", key: nistSp80038aAes128, "iv": "000102030405060708090a0b0c0d0e0f", "padding": false})).resolves.toEqual(new Uint8Array([107, 193, 190, 226, 46, 64, 159, 150, 233, 61, 126, 17, 115, 147, 23, 42]));
});

it("decrypts empty unpadded CBC input", async () => {
  await expect(runOp("aes-decrypt", "", {"mode": "CBC", key: nistSp80038aAes128, "iv": "000102030405060708090a0b0c0d0e0f", "padding": false})).resolves.toEqual(new Uint8Array([]));
});

it("matches NIST SP 800-38A CTR", async () => {
  await expect(runOp("aes-decrypt", new Uint8Array([135, 77, 97, 145, 182, 32, 227, 38, 27, 239, 104, 100, 153, 13, 182, 206]), {"mode": "CTR", key: nistSp80038aAes128, "iv": "f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff"})).resolves.toEqual(new Uint8Array([107, 193, 190, 226, 46, 64, 159, 150, 233, 61, 126, 17, 115, 147, 23, 42]));
});

it("rejects malformed CBC ciphertext", async () => {
  await expect(runOp("aes-decrypt", new Uint8Array([0]), {"mode": "CBC", key: nistSp80038aAes128, "iv": "000102030405060708090a0b0c0d0e0f", "padding": false})).rejects.toThrow(/AES.*(block|multiple)/i);
});

const gcm = {"mode": "GCM", key: nistSp80038aAes128, "iv": "000102030405060708090a0b", "aad": "metadata"};

it("roundtrips AES-GCM with additional authenticated data", async () => {
  const encrypted = await runOp("aes-encrypt", "hello", gcm);
  await expect(runOp("aes-decrypt", encrypted, gcm)).resolves.toEqual(new TextEncoder().encode("hello"));
});

it("rejects a changed GCM tag", async () => {
  const encrypted = await runOp("aes-encrypt", "hello", gcm) as Uint8Array;
  const modified = encrypted.slice();
  modified[modified.length - 1] = modified[modified.length - 1]! ^ 1;
  await expect(runOp("aes-decrypt", modified, gcm)).rejects.toThrow(/tag|authentication/i);
});

it("roundtrips empty plaintext with default CBC padding", async () => {
  const args = {key: nistSp80038aAes128, "iv": "000102030405060708090a0b0c0d0e0f"};
  const encrypted = await runOp("aes-encrypt", "", args);
  expect(encrypted).toHaveLength(16);
  await expect(runOp("aes-decrypt", encrypted, args)).resolves.toEqual(new Uint8Array());
});
