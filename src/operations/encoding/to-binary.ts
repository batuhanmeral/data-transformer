import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { chefDelimiter } from "../_chef-args";

export default defineOperation({
  id: "to-binary",
  name: "To Binary",
  category: "encoding",
  description: "Encode bytes as binary values.",
  input: "bytes",
  output: "string",
  args: z.object({
    delimiter: z.string().default(" ").meta({ label: "Delimiter" }),
    byteLength: z.number().int().min(8).max(256).default(8).meta({ label: "Bit width" }),
  }),
  run(input, { delimiter, byteLength }, ctx) {
    const values: string[] = [];
    for (const [index, byte] of input.entries()) {
      if (index % 65536 === 0) ctx.progress(index / input.length);
      values.push(byte.toString(2).padStart(byteLength, "0"));
    }
    return values.join(delimiter);
  },
  cyberchef: {
    name: "To Binary",
    mapArgs: ([delimiter, byteLength]) => ({
      delimiter: chefDelimiter(delimiter),
      byteLength: typeof byteLength === "number" ? byteLength : undefined,
    }),
  },
});
