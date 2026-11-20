import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("encodes Hello as Base64", async () => {
  await expect(runOp("to-base64", "Hello")).resolves.toBe("SGVsbG8=");
});

it("encodes empty input as an empty string", async () => {
  await expect(runOp("to-base64", "")).resolves.toBe("");
});

it("encodes URL-safe Base64 without padding", async () => {
  await expect(runOp("to-base64", Uint8Array.of(255, 239), { alphabet: "urlsafe" })).resolves.toBe("_-8");
});
