import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { detectHex } from "../../core/magic/detectors";
import { chefDelimiter } from "../_chef-args";

export default defineOperation({
  id: "from-hex",
  name: "From Hex",
  category: "encoding",
  description: "Read hexadecimal bytes with optional prefixes and separators.",
  input: "string",
  output: "bytes",
  args: z.object({
    delimiter: z.string().default("").meta({ label: "Additional delimiter" }),
  }),
  run(input, { delimiter }, ctx) {
    const source = delimiter ? input.replaceAll(delimiter, "") : input;
    const chunks = source.split(/(?:\s|[,;:-]|0x|\\x|%)+/i).filter(Boolean);
    const output = new Uint8Array(Math.floor(source.length / 2));
    let offset = 0;
    let processed = 0;
    for (const chunk of chunks) {
      if (chunk.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(chunk)) throw new Error("Invalid hexadecimal byte.");
      for (let i = 0; i < chunk.length; i += 2) {
        if (processed % 65536 === 0) ctx.progress(processed / source.length);
        output[offset++] = Number.parseInt(chunk.slice(i, i + 2), 16);
        processed += 2;
      }
    }
    if (offset === 0 && source.trim().length > 0) throw new Error("Invalid hexadecimal input.");
    return output.slice(0, offset);
  },
  magic: { detect: detectHex },
  cyberchef: {
    name: "From Hex",
    mapArgs([delimiter]) {
      if (["Auto", "Percent", "0x", "0x with comma", "\\x"].includes(String(delimiter))) return {};
      return { delimiter: chefDelimiter(delimiter) };
    },
  },
});
