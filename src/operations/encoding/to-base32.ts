import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { base32Alphabets, chefBase32Alphabet } from "./_base32";

export default defineOperation({
  id: "to-base32",
  name: "To Base32",
  category: "encoding",
  description: "Encode bytes as padded Base32.",
  input: "bytes",
  output: "string",
  args: z.object({
    alphabet: z.enum(["standard", "hex"]).default("standard").meta({ label: "Alphabet" }),
  }),
  run(input, { alphabet }, ctx) {
    const symbols = base32Alphabets[alphabet];
    let buffer = 0;
    let bits = 0;
    let result = "";
    for (const [index, byte] of input.entries()) {
      if (index % 65536 === 0) ctx.progress(index / input.length);
      buffer = (buffer << 8) | byte;
      bits += 8;
      while (bits >= 5) {
        bits -= 5;
        result += symbols[(buffer >>> bits) & 31];
      }
    }
    if (bits > 0) result += symbols[(buffer << (5 - bits)) & 31];
    return result.padEnd(Math.ceil(result.length / 8) * 8, "=");
  },
  cyberchef: {
    name: "To Base32",
    mapArgs: ([alphabet]) => ({ alphabet: chefBase32Alphabet(alphabet) }),
  },
});
