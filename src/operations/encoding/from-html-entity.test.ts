import { expect, it } from "vitest";
import { runOp } from "../_test-utils";

it("decodes named and numeric entities", async () => {
  await expect(runOp("from-html-entity", "&#x41;&#66;&amp;")).resolves.toBe("AB&");
});

it("decodes empty input", async () => {
  await expect(runOp("from-html-entity", "")).resolves.toBe("");
});

it("rejects invalid numeric code points", async () => {
  await expect(runOp("from-html-entity", "&#x110000;")).rejects.toThrow(/invalid/i);
});

it("leaves bare ampersands intact", async () => {
  await expect(runOp("from-html-entity", "cats & dogs")).resolves.toBe("cats & dogs");
});
