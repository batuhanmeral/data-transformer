import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("hashes abc to the known digest", async () => {
  await expect(runOp("blake3", "abc")).resolves.toBe("6437b3ac38465133ffb63b75273a8db548c558465d79db03fd359c6cd5bd9d85");
});

it("hashes empty input to the known digest", async () => {
  await expect(runOp("blake3", "")).resolves.toBe("af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262");
});
