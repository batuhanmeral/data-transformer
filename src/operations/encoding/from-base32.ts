import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { detectBase32 } from "../../core/magic/detectors";
import { base32Alphabets, chefBase32Alphabet } from "./_base32";

export default defineOperation({
  id: "from-base32",
  name: "From Base32",
  category: "encoding",
  description: "Decode padded or unpadded Base32.",
  input: "string",
  output: "bytes",
  args: z.object({
    alphabet: z.enum(["standard", "hex"]).default("standard").meta({ label: "Alphabet" }),
    ignoreInvalid: z.boolean().default(false).meta({ label: "Ignore non-alphabet characters" }),
  }),
  run(input, { alphabet, ignoreInvalid }, ctx) {
    const symbols = base32Alphabets[alphabet];
    const clean = input.replace(/\s/g, "").toUpperCase();
    const normalized = ignoreInvalid ? Array.from(clean).filter((ch) => ch === "=" || symbols.includes(ch)).join("") : clean;
    const data = normalized.replace(/=+$/, "");
    const padding = normalized.length - data.length;
    const remainder = data.length % 8;
    if (![0, 2, 4, 5, 7].includes(remainder) || (padding > 0 && (remainder === 0 || padding !== 8 - remainder))) {
      throw new Error("Invalid Base32 length or padding.");
    }

    const output = new Uint8Array(Math.floor(data.length * 5 / 8));
    let buffer = 0;
    let bits = 0;
    let offset = 0;
    for (let i = 0; i < data.length; i++) {
      if (i % 65536 === 0) ctx.progress(i / data.length);
      const value = symbols.indexOf(data.charAt(i));
      if (value < 0) throw new Error("Invalid Base32 character.");
      buffer = (buffer << 5) | value;
      bits += 5;
      if (bits >= 8) {
        bits -= 8;
        output[offset++] = (buffer >>> bits) & 255;
      }
    }
    if (buffer & ((1 << bits) - 1)) throw new Error("Invalid Base32 trailing bits.");
    return output;
  },
  magic: { detect: detectBase32 },
  cyberchef: {
    name: "From Base32",
    mapArgs: ([alphabet, ignoreInvalid]) => ({
      alphabet: chefBase32Alphabet(alphabet),
      ignoreInvalid: typeof ignoreInvalid === "boolean" ? ignoreInvalid : true,
    }),
  },
});
