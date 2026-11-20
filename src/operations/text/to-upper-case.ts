import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";

export default defineOperation({
  id: "to-upper-case",
  name: "To Upper Case",
  category: "text",
  description: "Convert text to uppercase.",
  input: "string",
  output: "string",
  args: z.object({}),
  run: (input) => input.toUpperCase(),
  cyberchef: {
    name: "To Upper case",
    mapArgs: () => ({}),
  },
});
