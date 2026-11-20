import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { chefDelimiter } from "../_chef-args";

export default defineOperation({
  id: "join",
  name: "Join",
  category: "text",
  description: "Replace a delimiter by splitting text and joining the parts.",
  input: "string",
  output: "string",
  args: z.object({
    delimiter: z.string().default("\n").meta({ label: "Split delimiter", multiline: true }),
    joinWith: z.string().default(",").meta({ label: "Join delimiter", multiline: true }),
  }),
  run(input, { delimiter, joinWith }) {
    return delimiter === "" ? Array.from(input).join(joinWith) : input.split(delimiter).join(joinWith);
  },
  cyberchef: {
    // CyberChef has one Split operation with separate split and join delimiters.
    name: "Split",
    mapArgs: ([delimiter, joinWith]) => ({ delimiter: chefDelimiter(delimiter) ?? ",", joinWith: chefDelimiter(joinWith) ?? "\n" }),
  },
});
