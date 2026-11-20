import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("hashes abc to the known digest", async () => {
  await expect(runOp("blake2s", "abc")).resolves.toBe("508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982");
});

it("hashes empty input to the known digest", async () => {
  await expect(runOp("blake2s", "")).resolves.toBe("69217a3079908094e11121d042354a7c1f55b6482ca1a51e1b250dfd1ed0eef9");
});
