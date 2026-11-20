import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { vigenere } from "./_vigenere";

export default defineOperation({
  id: "vigenere-encode",
  name: "Vigenère Encode",
  category: "crypto",
  description: "Encode text using a repeating Vigenère key.",
  input: "string",
  output: "string",
  args: z.object({
    key: z.string().default("").meta({ label: "Alphabetic key" }),
  }),
  run: (input, { key }, ctx) => vigenere(input, key, 1, ctx),
  cyberchef: {
    name: "Vigenère Encode",
    mapArgs: ([key]) => ({ key: typeof key === "string" ? key : undefined }),
  },
});
