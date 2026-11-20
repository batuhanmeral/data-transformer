import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { collectPackages, renderNotices } from "./gen-licenses";

let root: string;

function addPackage(
  dir: string,
  manifest: Record<string, unknown>,
  files: Record<string, string> = {},
): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify(manifest));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "gen-licenses-"));
  const modules = join(root, "node_modules");

  addPackage(
    join(modules, "app-dep"),
    {
      name: "app-dep",
      version: "1.0.0",
      license: "MIT",
      dependencies: { "nested-dep": "^2.0.0" },
      optionalDependencies: { "native-binary": "^1.0.0" },
      peerDependencies: { "peer-only": "^1.0.0" },
    },
    { LICENSE: "MIT License\nCopyright app-dep\n" },
  );
  // Resolved from app-dep's own node_modules, as pnpm and nested npm installs do.
  addPackage(
    join(modules, "app-dep", "node_modules", "nested-dep"),
    { name: "nested-dep", version: "2.1.0", license: "Apache-2.0" },
    { "LICENSE.md": "Apache License\n", NOTICE: "nested-dep NOTICE\n" },
  );
  addPackage(join(modules, "native-binary"), { name: "native-binary", version: "1.0.0", license: "LGPL-3.0" });
  addPackage(join(modules, "peer-only"), { name: "peer-only", version: "1.0.0", license: "MIT" });
  addPackage(join(modules, "@scope", "no-file"), { name: "@scope/no-file", version: "0.1.0", license: "ISC" });
  addPackage(
    join(modules, "css-only"),
    { name: "css-only", version: "3.0.0", license: "MIT", dependencies: { "cli-dep": "^1.0.0" } },
    { "LICENSE.txt": "css-only license\n" },
  );
  addPackage(join(modules, "cli-dep"), { name: "cli-dep", version: "1.0.0", license: "MIT" });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("collectPackages", () => {
  it("follows required dependencies only and keeps CSS-only roots shallow", () => {
    const packages = collectPackages(root, ["app-dep", "@scope/no-file"], ["css-only"]);

    expect(packages.map(({ name, version }) => `${name}@${version}`)).toEqual([
      "@scope/no-file@0.1.0",
      "app-dep@1.0.0",
      "css-only@3.0.0",
      "nested-dep@2.1.0",
    ]);
  });

  it("reads license and notice files in a stable order", () => {
    const nested = collectPackages(root, ["app-dep"], []).find(({ name }) => name === "nested-dep");

    expect(nested).toMatchObject({
      license: "Apache-2.0",
      files: [
        { name: "LICENSE.md", text: "Apache License\n" },
        { name: "NOTICE", text: "nested-dep NOTICE\n" },
      ],
    });
  });

  it("fails when a root dependency is not installed", () => {
    expect(() => collectPackages(root, ["missing"], [])).toThrow(/missing/);
  });
});

describe("renderNotices", () => {
  it("lists every package with its license text or declared license", () => {
    const text = renderNotices(collectPackages(root, ["app-dep", "@scope/no-file"], []));

    expect(text).toContain("app-dep 1.0.0 (MIT)");
    expect(text).toContain("MIT License\nCopyright app-dep");
    expect(text).toContain("@scope/no-file 0.1.0 (ISC)");
    expect(text).toContain("No license file is included in the package.");
    expect(text.indexOf("@scope/no-file")).toBeLessThan(text.indexOf("app-dep 1.0.0"));
  });
});
