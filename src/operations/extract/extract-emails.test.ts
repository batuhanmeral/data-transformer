import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("extracts an email next to punctuation", async () => {
  await expect(runOp("extract-emails", "a@b.co, x")).resolves.toBe("a@b.co");
});

it("accepts plus addressing and subdomains but skips malformed addresses", async () => {
  await expect(runOp("extract-emails", "me+tag@mail.example.org. a..b@b.co a@-b.co a@b..co a@b.co- a@b"))
    .resolves.toBe("me+tag@mail.example.org");
});

it("deduplicates only when requested", async () => {
  await expect(runOp("extract-emails", "a@b.co a@b.co")).resolves.toBe("a@b.co\na@b.co");
  await expect(runOp("extract-emails", "a@b.co a@b.co", { unique: true })).resolves.toBe("a@b.co");
});

it("returns an empty list for empty input", async () => {
  await expect(runOp("extract-emails", "")).resolves.toBe("");
});
