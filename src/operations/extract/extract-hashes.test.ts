import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

const md5 = "d41d8cd98f00b204e9800998ecf8427e";
const sha1 = "a9993e364706816aba3e25717850c26c9cd0d89d";
const sha256 = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

it.each([
  ["md5", md5],
  ["sha1", sha1],
  ["sha256", sha256],
])("extracts only the exact length for %s", async (algorithm, digest) => {
  await expect(runOp("extract-hashes", [md5, sha1, sha256, digest + "0"].join(" "), { algorithm }))
    .resolves.toBe(digest);
});

it("keeps the original case and deduplicates only when requested", async () => {
  const uppercase = md5.toUpperCase();
  const input = [uppercase, uppercase].join(" ");
  await expect(runOp("extract-hashes", input)).resolves.toBe([uppercase, uppercase].join("\n"));
  await expect(runOp("extract-hashes", input, { unique: true })).resolves.toBe(uppercase);
});

it("returns an empty list for empty input", async () => {
  await expect(runOp("extract-hashes", "")).resolves.toBe("");
});
