import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { chefDelimiter } from "../_chef-args";

export default defineOperation({
  id: "to-decimal",
  name: "To Decimal",
  category: "encoding",
  description: "Encode bytes as decimal values.",
  input: "bytes",
  output: "string",
  args: z.object({
    delimiter: z.string().default(" ").meta({ label: "Delimiter" }),
    signed: z.boolean().default(false).meta({ label: "Signed bytes" }),
  }),
  run(input, { delimiter, signed }, ctx) {
    const values: string[] = [];
    for (const [index, byte] of input.entries()) {
      if (index % 65536 === 0) ctx.progress(index / input.length);
      values.push(String(signed && byte > 127 ? byte - 256 : byte));
    }
    return values.join(delimiter);
  },
  cyberchef: {
    name: "To Decimal",
    mapArgs: ([delimiter, signed]) => ({
      delimiter: delimiter === "Auto" ? undefined : chefDelimiter(delimiter),
      signed: typeof signed === "boolean" ? signed : undefined,
    }),
  },
});
