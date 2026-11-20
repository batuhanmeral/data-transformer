import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { detectDecimal } from "../../core/magic/detectors";
import { chefDelimiter } from "../_chef-args";

export default defineOperation({
  id: "from-decimal",
  name: "From Decimal",
  category: "encoding",
  description: "Read unsigned or signed decimal bytes.",
  input: "string",
  output: "bytes",
  args: z.object({
    delimiter: z.string().default(" ").meta({ label: "Delimiter" }),
    signed: z.boolean().default(false).meta({ label: "Signed bytes" }),
  }),
  run(input, { delimiter, signed }, ctx) {
    const source = input.trim();
    if (!source) return new Uint8Array();
    const parts = delimiter === " " ? source.split(/[\s,;:]+/) : source.split(delimiter);
    const output = new Uint8Array(parts.length);
    for (const [index, part] of parts.entries()) {
      if (index % 65536 === 0) ctx.progress(index / parts.length);
      const value = Number(part);
      if (!/^-?\d+$/.test(part.trim()) || value < (signed ? -128 : 0) || value > (signed ? 127 : 255)) {
        throw new Error("Invalid decimal byte.");
      }
      output[index] = value;
    }
    return output;
  },
  magic: { detect: detectDecimal },
  cyberchef: {
    name: "From Decimal",
    mapArgs: ([delimiter, signed]) => ({
      delimiter: delimiter === "Auto" ? undefined : chefDelimiter(delimiter),
      signed: typeof signed === "boolean" ? signed : undefined,
    }),
  },
});
