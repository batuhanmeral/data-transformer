import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("converts the ISO epoch", async () => {
  await expect(runOp("date-to-timestamp", "1970-01-01T00:00:00.000Z")).resolves.toBe(0);
});

it("respects ISO offsets and milliseconds", async () => {
  await expect(runOp("date-to-timestamp", "1970-01-01T01:00:01.234+01:00", {"unit": "ms"})).resolves.toBe(1234);
});

it("rejects an empty date", async () => {
  await expect(runOp("date-to-timestamp", "")).rejects.toThrow(/invalid date/i);
});

it("rejects impossible dates", async () => {
  await expect(runOp("date-to-timestamp", "2025-02-29")).rejects.toThrow(/invalid date/i);
});

it("treats a date-only value as local time when requested", async () => {
  await expect(runOp("date-to-timestamp", "1970-01-01", { unit: "ms", treatAsUtc: false })).resolves.toBe(
    new Date(1970, 0, 1).getTime(),
  );
});
