import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("defaults to IPv4 and rejects an out-of-range octet", async () => {
  await expect(runOp("extract-ips", "1.2.3.4 999.1.1.1 ::1")).resolves.toBe("1.2.3.4");
});

it("can extract only IPv6 including the loopback address", async () => {
  await expect(runOp("extract-ips", "1.2.3.4 999.1.1.1 ::1", { v4: false, v6: true })).resolves.toBe("::1");
});

it("extracts both versions in order, including bracketed and IPv4-mapped IPv6", async () => {
  await expect(runOp("extract-ips", "[2001:db8::1]:443 1.2.3.4:443 ::ffff:192.0.2.1.", { v6: true }))
    .resolves.toBe("2001:db8::1\n1.2.3.4\n::ffff:192.0.2.1");
});

it("rejects malformed candidates without extracting a partial address", async () => {
  const input = "1.2.3.4.5 256.1.2.3 01.2.3.4 2001::db8::1 2001:db8:0:0:0:0:0 12345::1 ::ffff:999.1.1.1";
  await expect(runOp("extract-ips", input, { v6: true })).resolves.toBe("");
});

it("deduplicates only when requested", async () => {
  await expect(runOp("extract-ips", "1.2.3.4 1.2.3.4")).resolves.toBe("1.2.3.4\n1.2.3.4");
  await expect(runOp("extract-ips", "1.2.3.4 1.2.3.4", { unique: true })).resolves.toBe("1.2.3.4");
});

it("returns an empty list for empty input or when both versions are disabled", async () => {
  await expect(runOp("extract-ips", "")).resolves.toBe("");
  await expect(runOp("extract-ips", "1.2.3.4 ::1", { v4: false, v6: false })).resolves.toBe("");
});
