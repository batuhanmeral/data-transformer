import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { chefDelimiter } from "../_chef-args";

export default defineOperation({
  id: "to-charcode",
  name: "To Charcode",
  category: "encoding",
  description: "Write Unicode code points in the selected base.",
  input: "string",
  output: "string",
  args: z.object({
    delimiter: z.string().default(" ").meta({ label: "Delimiter" }),
    base: z.number().int().min(2).max(36).default(16).meta({ label: "Base" }),
  }),
  run(input, { delimiter, base }, ctx) {
    const values: string[] = [];
    let offset = 0;
    for (const character of input) {
      if (values.length % 65536 === 0) ctx.progress(offset / input.length);
      values.push(character.codePointAt(0)!.toString(base));
      offset += character.length;
    }
    return values.join(delimiter);
  },
  cyberchef: {
    name: "To Charcode",
    mapArgs: ([delimiter, base]) => ({
      delimiter: chefDelimiter(delimiter),
      base: typeof base === "number" ? base : undefined,
    }),
  },
});
