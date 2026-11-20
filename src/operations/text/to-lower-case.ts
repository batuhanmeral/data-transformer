import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";

export default defineOperation({
  id: "to-lower-case",
  name: "To Lower Case",
  category: "text",
  description: "Convert text to lowercase.",
  input: "string",
  output: "string",
  args: z.object({}),
  run: (input) => input.toLowerCase(),
  cyberchef: {
    name: "To Lower case",
    mapArgs: () => ({}),
  },
});
