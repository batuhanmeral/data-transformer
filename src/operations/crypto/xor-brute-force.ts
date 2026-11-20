import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { unsupportedChefOption } from "../_chef-args";

export default defineOperation({
  id: "xor-brute-force",
  name: "XOR Brute Force",
  category: "crypto",
  description: "Preview sample text for each single-byte XOR key.",
  input: "bytes",
  output: "string",
  args: z.object({
    keyLength: z.number().int().min(1).max(1).default(1).meta({ label: "Key length (bytes)" }),
    sampleLength: z.number().int().nonnegative().default(100).meta({ label: "Sample length (bytes)" }),
    printableOnly: z.boolean().default(true).meta({ label: "Printable results only" }),
  }),
  run(input, { sampleLength, printableOnly }, ctx) {
    const sample = input.subarray(0, sampleLength);
    if (sample.length === 0) return "";
    const lines: string[] = [];
    for (let key = 0; key < 256; key++) {
      ctx.progress(key / 256);
      let preview = "";
      let printable = true;
      for (const byte of sample) {
        const decoded = byte ^ key;
        const visible = decoded >= 32 && decoded <= 126;
        if (printableOnly && !visible) {
          printable = false;
          break;
        }
        preview += visible ? String.fromCharCode(decoded) : ".";
      }
      if (printable) lines.push(`key = ${key.toString(16).padStart(2, "0")}: ${preview}`);
    }
    ctx.progress(1);
    return lines.join("\n");
  },
  cyberchef: {
    name: "XOR Brute Force",
    mapArgs([keyLength, sampleLength, sampleOffset, scheme, preserveNull, printKey, asHex, crib]) {
      if ((sampleOffset !== undefined && sampleOffset !== 0) || (scheme !== undefined && scheme !== "Standard") ||
          preserveNull === true || printKey === false || asHex === true || (typeof crib === "string" && crib !== "")) {
        unsupportedChefOption("XOR Brute Force arguments");
      }
      return {
        keyLength: typeof keyLength === "number" ? keyLength : undefined,
        sampleLength: typeof sampleLength === "number" ? sampleLength : undefined,
        printableOnly: false,
      };
    },
  },
});
