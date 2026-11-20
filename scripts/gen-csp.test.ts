import { describe, expect, it } from "vitest";
import { buildCsp, collectInlineScriptHashes } from "./gen-csp";

describe("collectInlineScriptHashes", () => {
  it("hashes inline scripts and skips scripts with a src attribute", () => {
    expect(collectInlineScriptHashes('<script>a()</script><script src="/x.js"></script>')).toEqual([
      "sha256-qVpDBgj7bpq5hMAcGp3AOc79J3Y1Z4HvySTwKrWDoy4=",
    ]);
  });

  it("hashes the browser's normalized script text and ignores markup in comments", () => {
    expect(
      collectInlineScriptHashes(
        '<!-- <script>ignored()</script> --><script data-note=">">a()\r\n</script>',
      ),
    ).toEqual(["sha256-78Mb6dlYKSr4lLcPgR39KSZyUZtZQimBNqLd+C3BhA4="]);
  });
});

describe("buildCsp", () => {
  it("restricts scripts to same-origin sources and explicit hashes", () => {
    const directives = buildCsp(["sha256-AAA"]).split("; ");

    expect(directives).toEqual(expect.arrayContaining([
      "default-src 'none'",
      "script-src 'self' 'sha256-AAA'",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "object-src 'none'",
    ]));
    expect(directives.filter((directive) => directive.includes("'unsafe-inline'"))).toEqual([
      "style-src 'self' 'unsafe-inline'",
    ]);
  });
});
