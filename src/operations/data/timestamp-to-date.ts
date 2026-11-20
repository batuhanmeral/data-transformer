import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { chefTimestampUnit } from "./_timestamp-unit";

export default defineOperation({
  id: "timestamp-to-date",
  name: "Timestamp to Date",
  category: "data",
  description: "Convert a Unix timestamp to an ISO 8601 UTC date.",
  input: "string",
  output: "string",
  args: z.object({
    unit: z.enum(["s", "ms"]).default("s").meta({ label: "Timestamp unit" }),
  }),
  run(input, { unit }) {
    const source = input.trim();
    if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(source)) throw new Error("Invalid Unix timestamp.");
    const date = new Date(Number(source) * (unit === "s" ? 1000 : 1));
    if (!Number.isFinite(date.getTime())) throw new Error("Invalid Unix timestamp: date is out of range.");
    return date.toISOString();
  },
  cyberchef: {
    name: "From UNIX Timestamp",
    mapArgs: ([unit]) => ({ unit: chefTimestampUnit(unit) }),
  },
});
