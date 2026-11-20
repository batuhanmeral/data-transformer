import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { base58Symbols, bitcoinAlphabet } from "./_base58";

export default defineOperation({
  id: "from-base58",
  name: "From Base58",
  category: "encoding",
  description: "Decode bytes using the selected Base58 alphabet.",
  input: "string",
  output: "bytes",
  args: z.object({
    alphabet: z.string().default(bitcoinAlphabet).meta({ label: "Alphabet" }),
    ignoreInvalid: z.boolean().default(false).meta({ label: "Ignore non-alphabet characters" }),
  }),
  run(input, { alphabet, ignoreInvalid }, ctx) {
    const symbols = base58Symbols(alphabet);
    const values = new Map(symbols.map((symbol, index) => [symbol, index]));
    const digits: number[] = [];
    let leadingZeros = 0;
    let offset = 0;
    for (const char of input.trim()) {
      if (offset % 256 === 0) ctx.progress(offset / input.length);
      offset += char.length;
      const value = values.get(char);
      if (value === undefined) {
        if (ignoreInvalid) continue;
        throw new Error("Invalid Base58 character.");
      }
      if (digits.length === 0 && value === 0) {
        leadingZeros++;
        continue;
      }

      let carry = value;
      for (let i = 0; i < digits.length; i++) {
        carry += digits[i]! * 58;
        digits[i] = carry & 255;
        carry >>>= 8;
      }
      if (carry > 0) digits.push(carry);
    }

    const output = new Uint8Array(leadingZeros + digits.length);
    output.set(digits.reverse(), leadingZeros);
    return output;
  },
  cyberchef: {
    name: "From Base58",
    mapArgs: ([alphabet, ignoreInvalid]) => ({
      alphabet: typeof alphabet === "string" ? alphabet : undefined,
      ignoreInvalid: typeof ignoreInvalid === "boolean" ? ignoreInvalid : true,
    }),
  },
});
