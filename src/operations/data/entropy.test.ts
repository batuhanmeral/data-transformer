import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("measures constant bytes", async () => {
  await expect(runOp("entropy", "aaaa")).resolves.toBe(0);
});

it("measures two equally likely bytes", async () => {
  await expect(runOp("entropy", "ab")).resolves.toBe(1);
});

it("defines empty input as zero bits per byte", async () => {
  await expect(runOp("entropy", "")).resolves.toBe(0);
});

it("measures the full byte alphabet", async () => {
  await expect(runOp("entropy", Uint8Array.from({ length: 256 }, (_, byte) => byte))).resolves.toBe(8);
});
