import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";

export default defineOperation({
  id: "rot47",
  name: "ROT47",
  category: "crypto",
  description: "Rotate printable ASCII characters by a fixed amount.",
  input: "string",
  output: "string",
  args: z.object({
    amount: z.number().int().default(47).meta({ label: "Rotation amount" }),
  }),
  run(input, { amount }, ctx) {
    let count = 0;
    return input.replace(/[!-~]/g, (char, offset: number) => {
      if (count++ % 65536 === 0) ctx.progress(offset / input.length);
      return String.fromCharCode(33 + ((char.charCodeAt(0) - 33 + amount % 94 + 94) % 94));
    });
  },
  cyberchef: {
    name: "ROT47",
    mapArgs: ([amount]) => ({ amount: typeof amount === "number" ? amount : undefined }),
  },
});
