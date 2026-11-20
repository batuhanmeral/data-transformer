import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { vigenere } from "./_vigenere";

export default defineOperation({
  id: "vigenere-decode",
  name: "Vigenère Decode",
  category: "crypto",
  description: "Decode text using a repeating Vigenère key.",
  input: "string",
  output: "string",
  args: z.object({
    key: z.string().default("").meta({ label: "Alphabetic key" }),
  }),
  run: (input, { key }, ctx) => vigenere(input, key, -1, ctx),
  cyberchef: {
    name: "Vigenère Decode",
    mapArgs: ([key]) => ({ key: typeof key === "string" ? key : undefined }),
  },
});
