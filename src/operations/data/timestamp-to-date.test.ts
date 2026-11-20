import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("converts the Unix epoch", async () => {
  await expect(runOp("timestamp-to-date", 0)).resolves.toBe("1970-01-01T00:00:00.000Z");
});

it("accepts milliseconds", async () => {
  await expect(runOp("timestamp-to-date", 1234, {"unit": "ms"})).resolves.toBe("1970-01-01T00:00:01.234Z");
});

it("rejects an empty timestamp", async () => {
  await expect(runOp("timestamp-to-date", "")).rejects.toThrow(/invalid.*timestamp/i);
});

it("rejects dates outside the supported range", async () => {
  await expect(runOp("timestamp-to-date", "8640000000000001", {"unit": "ms"})).rejects.toThrow(/invalid.*timestamp/i);
});
