import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("hashes abc to the known digest", async () => {
  await expect(runOp("md5", "abc")).resolves.toBe("900150983cd24fb0d6963f7d28e17f72");
});

it("hashes empty input to the known digest", async () => {
  await expect(runOp("md5", "")).resolves.toBe("d41d8cd98f00b204e9800998ecf8427e");
});
