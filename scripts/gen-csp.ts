import { createHash } from "node:crypto";
import { globSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { defaultTreeAdapter, parse, type DefaultTreeAdapterTypes } from "parse5";

export function collectInlineScriptHashes(html: string): string[] {
  const hashes: string[] = [];

  function visit(node: DefaultTreeAdapterTypes.Node): void {
    if (defaultTreeAdapter.isElementNode(node) && node.tagName === "script") {
      if (!node.attrs.some(({ name }) => name === "src")) {
        const source = node.childNodes
          .filter(defaultTreeAdapter.isTextNode)
          .map(({ value }) => value)
          .join("");

        hashes.push(`sha256-${createHash("sha256").update(source).digest("base64")}`);
      }
      return;
    }

    if ("childNodes" in node) {
      for (const child of node.childNodes) visit(child);
    }
  }

  visit(parse(html));
  return hashes;
}

export function buildCsp(inlineScriptHashes: string[]): string {
  const scriptSources = ["'self'", ...inlineScriptHashes.map((hash) => `'${hash}'`)];

  return [
    "default-src 'none'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "frame-src 'self' blob:",
    "manifest-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join("; ");
}

function generateVercelConfig(check: boolean): void {
  const htmlFiles = globSync("out/**/*.html");
  if (htmlFiles.length === 0) {
    throw new Error("No HTML files found in out/. Run next build before generating deployment headers.");
  }

  const hashes = new Set(htmlFiles.flatMap((file) => collectInlineScriptHashes(readFileSync(file, "utf8"))));
  const config = {
    headers: [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: buildCsp([...hashes].sort()) },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()" },
        ],
      },
    ],
  };
  const expected = JSON.stringify(config, null, 2) + "\n";

  if (check) {
    const actual = readFileSync("vercel.json", { encoding: "utf8", flag: "r" });
    if (actual !== expected) throw new Error("vercel.json is stale. Run pnpm build to refresh it.");
    return;
  }

  writeFileSync("vercel.json", expected);
}

const entryFile = process.argv[1];
if (entryFile && import.meta.url === pathToFileURL(resolve(entryFile)).href) {
  try {
    generateVercelConfig(process.argv.includes("--check"));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
