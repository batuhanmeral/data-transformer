import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { chefDelimiter, unsupportedChefOption } from "../_chef-args";

export default defineOperation({
  id: "unique",
  name: "Unique",
  category: "text",
  description: "Keep the first occurrence of each delimited item.",
  input: "string",
  output: "string",
  args: z.object({
    delimiter: z.string().default("\n").meta({ label: "Delimiter", multiline: true }),
  }),
  run(input, { delimiter }, ctx) {
    const parts = delimiter ? input.split(delimiter) : Array.from(input);
    const seen = new Set<string>();
    for (const [index, part] of parts.entries()) {
      if (index % 65536 === 0) ctx.progress(index / parts.length);
      seen.add(part);
    }
    return Array.from(seen).join(delimiter);
  },
  cyberchef: {
    name: "Unique",
    mapArgs([delimiter, displayCount]) {
      if (displayCount === true) unsupportedChefOption("unique counts");
      return { delimiter: chefDelimiter(delimiter) };
    },
  },
});
