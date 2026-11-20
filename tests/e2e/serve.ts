import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const root = resolve("out");
const config = JSON.parse(await readFile("vercel.json", "utf8")) as {
  headers: { source: string; headers: { key: string; value: string }[] }[];
};
const production = config.headers.find(({ source }) => source === "/(.*)")?.headers;
if (!production) throw new Error("Expected production headers in vercel.json.");
const headers = Object.fromEntries(production.map(({ key, value }) => [key, value]));
const mime: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

createServer(async (request, response) => {
  for (const [key, value] of Object.entries(headers)) response.setHeader(key, value);
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }

  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }

  const path = resolve(root, "." + pathname);
  if (path !== root && !path.startsWith(root + sep)) {
    response.writeHead(403).end();
    return;
  }

  const candidates = pathname.endsWith("/")
    ? [resolve(path, "index.html")]
    : [path, path + ".html", resolve(path, "index.html")];
  for (const candidate of candidates) {
    const contents = await readFile(candidate).catch(() => undefined);
    if (contents) {
      const contentType = mime[extname(candidate)] ?? "application/octet-stream";
      response.writeHead(200, { "Content-Type": contentType });
      response.end(request.method === "HEAD" ? undefined : contents);
      return;
    }
  }

  response.writeHead(404).end();
}).listen(4173, "127.0.0.1");
