import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";

export default defineOperation({
  id: "rot13",
  name: "ROT13",
  category: "crypto",
  description: "Rotate letters and optionally digits by a fixed amount.",
  input: "string",
  output: "string",
  args: z.object({
    lower: z.boolean().default(true).meta({ label: "Rotate lowercase letters" }),
    upper: z.boolean().default(true).meta({ label: "Rotate uppercase letters" }),
    digits: z.boolean().default(false).meta({ label: "Rotate digits" }),
    amount: z.number().int().default(13).meta({ label: "Rotation amount" }),
  }),
  run(input, { lower, upper, digits, amount }, ctx) {
    let count = 0;
    return input.replace(/[A-Za-z0-9]/g, (char, offset: number) => {
      if (count++ % 65536 === 0) ctx.progress(offset / input.length);
      const code = char.charCodeAt(0);
      const start = code >= 97 ? 97 : code >= 65 ? 65 : 48;
      if ((start === 97 && !lower) || (start === 65 && !upper) || (start === 48 && !digits)) return char;
      const size = start === 48 ? 10 : 26;
      return String.fromCharCode(start + ((code - start + amount % size + size) % size));
    });
  },
  cyberchef: {
    name: "ROT13",
    mapArgs: ([lower, upper, digits, amount]) => ({
      lower: lower !== false,
      upper: upper !== false,
      digits: digits === true,
      amount: typeof amount === "number" ? amount : undefined,
    }),
  },
});
