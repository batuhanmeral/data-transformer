import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { base58Symbols, bitcoinAlphabet } from "./_base58";

export default defineOperation({
  id: "to-base58",
  name: "To Base58",
  category: "encoding",
  description: "Encode bytes with the selected Base58 alphabet.",
  input: "bytes",
  output: "string",
  args: z.object({
    alphabet: z.string().default(bitcoinAlphabet).meta({ label: "Alphabet" }),
  }),
  run(input, { alphabet }, ctx) {
    const symbols = base58Symbols(alphabet);
    let leadingZeros = 0;
    while (leadingZeros < input.length && input[leadingZeros] === 0) leadingZeros++;

    const digits: number[] = [];
    for (let index = leadingZeros; index < input.length; index++) {
      if (index % 256 === 0) ctx.progress(index / input.length);
      let carry = input[index]!;
      for (let i = 0; i < digits.length; i++) {
        carry += digits[i]! * 256;
        digits[i] = carry % 58;
        carry = Math.floor(carry / 58);
      }
      while (carry > 0) {
        digits.push(carry % 58);
        carry = Math.floor(carry / 58);
      }
    }
    return symbols[0]!.repeat(leadingZeros) + digits.reverse().map((digit) => symbols[digit]).join("");
  },
  cyberchef: {
    name: "To Base58",
    mapArgs: ([alphabet]) => ({ alphabet: typeof alphabet === "string" ? alphabet : undefined }),
  },
});
