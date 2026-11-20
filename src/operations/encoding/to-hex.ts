import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { chefDelimiter } from "../_chef-args";

export default defineOperation({
  id: "to-hex",
  name: "To Hex",
  category: "encoding",
  description: "Write bytes as two-digit hexadecimal values.",
  input: "bytes",
  output: "string",
  args: z.object({
    delimiter: z.string().default(" ").meta({ label: "Delimiter" }),
    prefix: z.string().default("").meta({ label: "Byte prefix" }),
    bytesPerLine: z.number().int().nonnegative().default(0).meta({ label: "Bytes per line" }),
  }),
  run(input, { delimiter, bytesPerLine, prefix }, ctx) {
    const lines: string[] = [];
    const width = bytesPerLine || input.length || 1;
    let line: string[] = [];
    for (const [index, byte] of input.entries()) {
      if (index % 65536 === 0) ctx.progress(index / input.length);
      line.push(prefix + byte.toString(16).padStart(2, "0"));
      if (line.length === width) {
        lines.push(line.join(delimiter));
        line = [];
      }
    }
    if (line.length > 0) lines.push(line.join(delimiter));
    return lines.join("\n");
  },
  cyberchef: {
    name: "To Hex",
    mapArgs([delimiter, bytesPerLine]) {
      const size = typeof bytesPerLine === "number" ? bytesPerLine : undefined;
      switch (delimiter) {
        case "Percent": return { prefix: "%", delimiter: "", bytesPerLine: size };
        case "0x": return { prefix: "0x", delimiter: " ", bytesPerLine: size };
        case "0x with comma": return { prefix: "0x", delimiter: ", ", bytesPerLine: size };
        case "\\x": return { prefix: "\\x", delimiter: "", bytesPerLine: size };
        default: return { delimiter: chefDelimiter(delimiter), bytesPerLine: size };
      }
    },
  },
});
