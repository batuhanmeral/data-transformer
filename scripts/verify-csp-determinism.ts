import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

function buildAndReadConfig(): Buffer {
  execFileSync("pnpm", ["build"], {
    shell: process.platform === "win32",
    stdio: "inherit",
  });
  return readFileSync("vercel.json");
}

const firstConfig = buildAndReadConfig();
const secondConfig = buildAndReadConfig();

if (firstConfig.equals(secondConfig)) {
  console.log("Both builds produced identical vercel.json files.");
} else {
  console.error("vercel.json differs between consecutive builds.");
  process.exitCode = 1;
}
