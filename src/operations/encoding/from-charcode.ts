import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { chefDelimiter } from "../_chef-args";

export default defineOperation({
  id: "from-charcode",
  name: "From Charcode",
  category: "encoding",
  description: "Read Unicode code points in the selected base.",
  input: "string",
  output: "string",
  args: z.object({
    delimiter: z.string().default(" ").meta({ label: "Delimiter" }),
    base: z.number().int().min(2).max(36).default(16).meta({ label: "Base" }),
  }),
  run(input, { delimiter, base }, ctx) {
    const source = input.trim();
    if (!source) return "";
    const parts = delimiter === " " ? source.split(/\s+/) : source.split(delimiter);
    let output = "";
    for (const [index, part] of parts.entries()) {
      if (index % 65536 === 0) ctx.progress(index / parts.length);
      const digits = part.trim();
      if (!/^[a-z0-9]+$/i.test(digits) || Array.from(digits).some((digit) => Number.parseInt(digit, 36) >= base)) {
        throw new Error("Invalid character code.");
      }
      const codePoint = Number.parseInt(digits, base);
      if (codePoint > 0x10ffff) throw new Error("Invalid Unicode code point.");
      output += String.fromCodePoint(codePoint);
    }
    return output;
  },
  cyberchef: {
    name: "From Charcode",
    mapArgs: ([delimiter, base]) => ({
      delimiter: chefDelimiter(delimiter),
      base: typeof base === "number" ? base : undefined,
    }),
  },
});
