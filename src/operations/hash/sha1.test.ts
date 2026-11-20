import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("hashes abc to the known digest", async () => {
  await expect(runOp("sha1", "abc")).resolves.toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
});

it("hashes empty input to the known digest", async () => {
  await expect(runOp("sha1", "")).resolves.toBe("da39a3ee5e6b4b0d3255bfef95601890afd80709");
});
