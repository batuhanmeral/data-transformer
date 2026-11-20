import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("hashes abc to the known digest", async () => {
  await expect(runOp("sha3", "abc")).resolves.toBe("3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532");
});

it("hashes empty input to the known digest", async () => {
  await expect(runOp("sha3", "")).resolves.toBe("a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a");
});

it("supports SHA3-224", async () => {
  await expect(runOp("sha3", "abc", {"variant": 224})).resolves.toBe("e642824c3f8cf24ad09234ee7d3c766fc9a3a5168d0c94ad73b46fdf");
});

it("supports SHA3-384", async () => {
  await expect(runOp("sha3", "abc", {"variant": 384})).resolves.toBe("ec01498288516fc926459f58e2c6ad8df9b473cb0fc08c2596da7cf0e49be4b298d88cea927ac7f539f1edf228376d25");
});

it("supports SHA3-512", async () => {
  await expect(runOp("sha3", "abc", {"variant": 512})).resolves.toBe("b751850b1a57168a5693cd924b6b096e08f621827444f70d884f5d0240d2712e10e116e9192af3c91a7ec57647e3934057340b4cf408d5a56592f8274eec53f0");
});
