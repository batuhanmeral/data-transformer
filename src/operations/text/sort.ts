import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { chefDelimiter, unsupportedChefOption } from "../_chef-args";

export default defineOperation({
  id: "sort",
  name: "Sort",
  category: "text",
  description: "Sort delimited items alphabetically, numerically, or by length.",
  input: "string",
  output: "string",
  args: z.object({
    delimiter: z.string().default("\n").meta({ label: "Delimiter", multiline: true }),
    reverse: z.boolean().default(false).meta({ label: "Descending order" }),
    order: z.enum(["alpha", "numeric", "length"]).default("alpha").meta({ label: "Sort by" }),
    caseInsensitive: z.boolean().default(false).meta({ label: "Case insensitive" }),
  }),
  run(input, { delimiter, reverse, order, caseInsensitive }) {
    const parts = delimiter ? input.split(delimiter) : Array.from(input);
    let compare: (left: string, right: string) => number;
    if (order === "numeric") {
      compare = (left, right) => {
        const a = Number(left);
        const b = Number(right);
        if (Number.isNaN(a)) return Number.isNaN(b) ? 0 : 1;
        return Number.isNaN(b) ? -1 : a - b;
      };
    } else if (order === "length") {
      compare = (left, right) => left.length - right.length;
    } else {
      compare = (left, right) => {
        const a = caseInsensitive ? left.toLowerCase() : left;
        const b = caseInsensitive ? right.toLowerCase() : right;
        return a < b ? -1 : a > b ? 1 : 0;
      };
    }
    return parts.sort(reverse ? (left, right) => compare(right, left) : compare).join(delimiter);
  },
  cyberchef: {
    name: "Sort",
    mapArgs([delimiter, reverse, order]) {
      if (![undefined, "Alphabetical (case sensitive)", "Alphabetical (case insensitive)", "Numeric", "Length"].includes(order as string | undefined)) {
        unsupportedChefOption("sort order");
      }
      return {
        delimiter: chefDelimiter(delimiter),
        reverse: reverse === true,
        order: order === "Numeric" ? "numeric" as const : order === "Length" ? "length" as const : "alpha" as const,
        caseInsensitive: order === "Alphabetical (case insensitive)",
      };
    },
  },
});
