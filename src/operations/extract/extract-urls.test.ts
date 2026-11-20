import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("extracts URLs and keeps query strings", async () => {
  await expect(runOp("extract-urls", "see https://a.com/x?y=1 and http://b.org"))
    .resolves.toBe("https://a.com/x?y=1\nhttp://b.org");
});

it("removes surrounding punctuation and preserves balanced parentheses", async () => {
  await expect(runOp("extract-urls", "<https://[::1]:8080/> (https://a.com/a(b)). http://"))
    .resolves.toBe("https://[::1]:8080/\nhttps://a.com/a(b)");
});

it("deduplicates only when requested", async () => {
  const input = "https://a.com https://b.com https://a.com";
  await expect(runOp("extract-urls", input)).resolves.toBe("https://a.com\nhttps://b.com\nhttps://a.com");
  await expect(runOp("extract-urls", input, { unique: true })).resolves.toBe("https://a.com\nhttps://b.com");
});

it("returns an empty list for empty input", async () => {
  await expect(runOp("extract-urls", "")).resolves.toBe("");
});

it("ignores URLs without a host", async () => {
  await expect(runOp("extract-urls", "custom://?query file://#fragment https://example.org"))
    .resolves.toBe("https://example.org");
});
