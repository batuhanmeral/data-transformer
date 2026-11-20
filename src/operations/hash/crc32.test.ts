import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("checks the reference sequence", async () => {
  await expect(runOp("crc32", "123456789")).resolves.toBe("cbf43926");
});

it("checks empty input", async () => {
  await expect(runOp("crc32", "")).resolves.toBe("00000000");
});
