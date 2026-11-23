import { existsSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Dev dependencies whose stylesheets are bundled into the site. Only the
// package itself ships, so its own dependencies are not followed.
const CSS_ONLY_PACKAGES = ["tailwindcss", "tw-animate-css", "shadcn"];
const OUTPUT_FILE = "out/THIRD-PARTY-NOTICES.txt";
const LICENSE_FILE = /^(licen[cs]e|copying|notice)([.-].*)?$/i;

interface Manifest {
  name: string;
  version: string;
  license?: string | { type?: string };
  dependencies?: Record<string, string>;
}

export interface PackageNotice {
  name: string;
  version: string;
  license: string;
  files: { name: string; text: string }[];
}

function readManifest(dir: string): Manifest {
  return JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as Manifest;
}

// Node's lookup: the nearest node_modules/<name> walking up from the requester.
function resolvePackageDir(name: string, fromDir: string): string {
  let dir = fromDir;
  for (;;) {
    const candidate = join(dir, "node_modules", name);
    if (existsSync(join(candidate, "package.json"))) return realpathSync(candidate);
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`Cannot resolve ${name} from ${fromDir}. Run pnpm install.`);
    dir = parent;
  }
}

function readLicenseFiles(dir: string): PackageNotice["files"] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && LICENSE_FILE.test(entry.name))
    .map((entry) => entry.name)
    .sort()
    .map((name) => ({ name, text: readFileSync(join(dir, name), "utf8") }));
}

function declaredLicense(manifest: Manifest): string {
  const { license } = manifest;
  if (typeof license === "string") return license;
  return license?.type ?? "UNKNOWN";
}

/**
 * Collects the packages that ship in the static export: the transitive
 * required dependencies of `roots` plus the `cssOnlyRoots` themselves.
 * Optional and peer dependencies are skipped, so the result depends only on
 * the lockfile, not on the platform-specific binaries pnpm installed.
 */
export function collectPackages(rootDir: string, roots: string[], cssOnlyRoots: string[]): PackageNotice[] {
  const found = new Map<string, PackageNotice>();
  const visited = new Set<string>();

  function add(dir: string, followDependencies: boolean): void {
    if (visited.has(dir)) return;
    visited.add(dir);

    const manifest = readManifest(dir);
    const key = `${manifest.name}@${manifest.version}`;
    if (!found.has(key)) {
      found.set(key, {
        name: manifest.name,
        version: manifest.version,
        license: declaredLicense(manifest),
        files: readLicenseFiles(dir),
      });
    }

    if (!followDependencies) return;
    for (const dependency of Object.keys(manifest.dependencies ?? {})) {
      add(resolvePackageDir(dependency, dir), true);
    }
  }

  const start = resolve(rootDir);
  for (const name of roots) add(resolvePackageDir(name, start), true);
  for (const name of cssOnlyRoots) add(resolvePackageDir(name, start), false);

  return [...found.values()].sort(
    (a, b) => a.name.localeCompare(b.name, "en") || a.version.localeCompare(b.version, "en"),
  );
}

export function renderNotices(packages: PackageNotice[]): string {
  const rule = "=".repeat(78);
  const sections = packages.map(({ name, version, license, files }) => {
    const body =
      files.length === 0
        ? `License: ${license}\nNo license file is included in the package.`
        : files.map(({ name: file, text }) => `--- ${file} ---\n${text.trimEnd()}`).join("\n\n");
    return `${rule}\n${name} ${version} (${license})\n${rule}\n\n${body}\n`;
  });

  return [
    "Data Workbench third-party notices",
    "",
    "This site includes the following third-party packages. Each package is",
    "listed with the license and notice files it is distributed with.",
    "",
    ...sections,
  ].join("\n");
}

function generateNotices(): void {
  if (!existsSync("out")) {
    throw new Error("out/ does not exist. Run next build before generating third-party notices.");
  }

  const roots = Object.keys(readManifest(".").dependencies ?? {});
  writeFileSync(OUTPUT_FILE, renderNotices(collectPackages(".", roots, CSS_ONLY_PACKAGES)));
}

const entryFile = process.argv[1];
if (entryFile && import.meta.url === pathToFileURL(resolve(entryFile)).href) {
  try {
    generateNotices();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
