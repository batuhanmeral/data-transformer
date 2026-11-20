import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

// Public example from the JWT.io debugger.
const jwtIoExample = [
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
  "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
].join(".");

it("decodes the public JWT.io header and payload", async () => {
  await expect(runOp("jwt-decode", jwtIoExample)).resolves.toEqual({"header": {"alg": "HS256", "typ": "JWT"}, "payload": {"sub": "1234567890", "name": "John Doe", "iat": 1516239022}});
});

it("rejects empty input", async () => {
  await expect(runOp("jwt-decode", "")).rejects.toThrow(/invalid JWT/i);
});

it("rejects invalid Base64URL segments", async () => {
  await expect(runOp("jwt-decode", "a!.eyJmb28iOjF9.KQ")).rejects.toThrow(/invalid JWT/i);
});

it("rejects non-JSON payloads", async () => {
  await expect(runOp("jwt-decode", "e30.bm90LWpzb24.")).rejects.toThrow(/invalid JWT/i);
});
