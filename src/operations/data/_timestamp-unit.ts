import { unsupportedChefOption } from "../_chef-args";

export function chefTimestampUnit(unit: unknown): "s" | "ms" {
  if (unit === undefined || unit === "Seconds (s)") return "s";
  if (unit === "Milliseconds (ms)") return "ms";
  return unsupportedChefOption("timestamp unit");
}
