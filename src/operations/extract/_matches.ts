import { z } from "@/lib/zod";
import { unsupportedChefOption } from "../_chef-args";

export const uniqueArg = z.boolean().default(false).meta({ label: "Unique matches" });

export function formatMatches(matches: string[], unique: boolean, format: "list" | "json" = "list"): string {
  const results = unique ? [...new Set(matches)] : matches;
  return format === "json" ? JSON.stringify(results) : results.join("\n");
}

export function mapChefListArgs([displayTotal, sort, unique]: unknown[]) {
  if (displayTotal === true) unsupportedChefOption("display of the match total");
  if (sort === true) unsupportedChefOption("sorting of matches");
  return { unique: unique === true };
}
