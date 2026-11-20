import { expect, it } from "vitest";
import { runOp } from "../_test-utils";
import { nistSp80038aAes128 } from "./_aes-vectors";

it("matches NIST SP 800-38A CBC without padding", async () => {
  await expect(runOp("aes-encrypt", new Uint8Array([107, 193, 190, 226, 46, 64, 159, 150, 233, 61, 126, 17, 115, 147, 23, 42]), {"mode": "CBC", key: nistSp80038aAes128, "iv": "000102030405060708090a0b0c0d0e0f", "padding": false})).resolves.toEqual(new Uint8Array([118, 73, 171, 172, 129, 25, 178, 70, 206, 233, 142, 155, 18, 233, 25, 125]));
});

it("encrypts empty unpadded CBC input", async () => {
  await expect(runOp("aes-encrypt", "", {"mode": "CBC", key: nistSp80038aAes128, "iv": "000102030405060708090a0b0c0d0e0f", "padding": false})).resolves.toEqual(new Uint8Array([]));
});

it("matches NIST SP 800-38A CTR", async () => {
  await expect(runOp("aes-encrypt", new Uint8Array([107, 193, 190, 226, 46, 64, 159, 150, 233, 61, 126, 17, 115, 147, 23, 42]), {"mode": "CTR", key: nistSp80038aAes128, "iv": "f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff"})).resolves.toEqual(new Uint8Array([135, 77, 97, 145, 182, 32, 227, 38, 27, 239, 104, 100, 153, 13, 182, 206]));
});

it("rejects a key of the wrong length", async () => {
  await expect(runOp("aes-encrypt", new Uint8Array([107, 193, 190, 226, 46, 64, 159, 150, 233, 61, 126, 17, 115, 147, 23, 42]), {"mode": "CBC", "key": "00", "iv": "000102030405060708090a0b0c0d0e0f", "padding": false})).rejects.toThrow(/AES key must be 16, 24, or 32 bytes/i);
});

it("appends a 16-byte GCM tag to the ciphertext", async () => {
  const args = {"mode": "GCM", key: nistSp80038aAes128, "iv": "000102030405060708090a0b", "aad": "metadata"};
  const encrypted = await runOp("aes-encrypt", "hello", args);
  expect(encrypted).toBeInstanceOf(Uint8Array);
  expect(encrypted).toHaveLength(21);
});
