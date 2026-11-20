import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { chefTimestampUnit } from "./_timestamp-unit";
import { unsupportedChefOption } from "../_chef-args";

const isoPattern = /^((?:\d{4}|[+-]\d{6})-\d{2}-\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

export default defineOperation({
  id: "date-to-timestamp",
  name: "Date to Timestamp",
  category: "data",
  description: "Convert an ISO 8601 date to a Unix timestamp.",
  input: "string",
  output: "number",
  args: z.object({
    unit: z.enum(["s", "ms"]).default("s").meta({ label: "Timestamp unit" }),
    treatAsUtc: z.boolean().default(true).meta({ label: "Treat dates without an offset as UTC" }),
  }),
  run(input, { unit, treatAsUtc }) {
    const source = input.trim().replace(" ", "T");
    const match = isoPattern.exec(source);
    if (!match) throw new Error("Invalid date. Use an ISO 8601 date or date and time.");
    const day = match[1]!;
    const calendarDate = new Date(`${day}T00:00:00.000Z`);
    if (!Number.isFinite(calendarDate.getTime()) || !calendarDate.toISOString().startsWith(`${day}T`)) {
      throw new Error("Invalid date.");
    }

    const dateTime = source.includes("T") ? source : `${source}T00:00:00`;
    const hasOffset = match[2] !== undefined;
    const milliseconds = Date.parse(!hasOffset && treatAsUtc ? `${dateTime}Z` : dateTime);
    if (!Number.isFinite(milliseconds)) throw new Error("Invalid date or time.");
    return unit === "s" ? milliseconds / 1000 : milliseconds;
  },
  cyberchef: {
    name: "To UNIX Timestamp",
    mapArgs([unit, treatAsUtc, showParsed]) {
      if (showParsed === true) unsupportedChefOption("display of the parsed date alongside the timestamp");
      return { unit: chefTimestampUnit(unit), treatAsUtc: treatAsUtc !== false };
    },
  },
});
