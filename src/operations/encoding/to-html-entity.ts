import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";

const named: Record<string, string> = { "&": "amp", "<": "lt", ">": "gt", '"': "quot", "'": "apos" };

export default defineOperation({
  id: "to-html-entity",
  name: "To HTML Entity",
  category: "encoding",
  description: "Escape HTML markup characters or encode every character.",
  input: "string",
  output: "string",
  args: z.object({
    all: z.boolean().default(false).meta({ label: "Encode all characters" }),
    format: z.enum(["named", "decimal", "hex"]).default("named").meta({ label: "Format" }),
  }),
  run(input, { all, format }, ctx) {
    let output = "";
    let offset = 0;
    let index = 0;
    for (const char of input) {
      if (index++ % 65536 === 0) ctx.progress(offset / input.length);
      offset += char.length;
      const entity = named[char];
      if (entity === undefined && !all) {
        output += char;
        continue;
      }
      const codePoint = char.codePointAt(0)!;
      if (format === "hex") output += `&#x${codePoint.toString(16)};`;
      else if (format === "named" && entity !== undefined) output += `&${entity};`;
      else output += `&#${codePoint};`;
    }
    return output;
  },
  cyberchef: {
    name: "To HTML Entity",
    mapArgs: ([all, format]) => ({
      all: all === true,
      format: format === "Hex entities" ? "hex" as const : format === "Numeric entities" ? "decimal" as const : "named" as const,
    }),
  },
});
