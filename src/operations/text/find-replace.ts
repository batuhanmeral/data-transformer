import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { chefToggle, unsupportedChefOption } from "../_chef-args";
import { escapeRegExp, makeRegExp } from "./_regexp";

export default defineOperation({
  id: "find-replace",
  name: "Find / Replace",
  category: "text",
  description: "Find a regular expression or literal text and replace matches.",
  input: "string",
  output: "string",
  args: z.object({
    find: z.string().default("").meta({ label: "Find" }),
    mode: z.enum(["regex", "simple"]).default("regex").meta({ label: "Mode" }),
    replace: z.string().default("").meta({ label: "Replace with" }),
    global: z.boolean().default(true).meta({ label: "Replace all" }),
    caseInsensitive: z.boolean().default(false).meta({ label: "Case insensitive" }),
    multiline: z.boolean().default(false).meta({ label: "Multiline matching" }),
    dotAll: z.boolean().default(false).meta({ label: "Dot matches line breaks" }),
  }),
  run(input, { find, replace, mode, global, caseInsensitive, multiline, dotAll }) {
    if (!find) return input;
    const flags = (global ? "g" : "") + (caseInsensitive ? "i" : "") + (multiline ? "m" : "") + (dotAll ? "s" : "");
    const pattern = mode === "regex" ? find : escapeRegExp(find);
    const expression = makeRegExp(pattern, flags);
    return mode === "simple" ? input.replace(expression, () => replace) : input.replace(expression, replace);
  },
  cyberchef: {
    name: "Find / Replace",
    mapArgs([find, replace, global, caseInsensitive, multiline, dotAll]) {
      const toggle = chefToggle(find, "Regex");
      if (toggle.option !== "Regex" && toggle.option !== "Simple string") unsupportedChefOption("find mode");
      return {
        find: toggle.string,
        replace: typeof replace === "string" ? replace : undefined,
        mode: toggle.option === "Regex" ? "regex" as const : "simple" as const,
        global: global !== false,
        caseInsensitive: caseInsensitive === true,
        multiline: multiline !== false,
        dotAll: dotAll === true,
      };
    },
  },
});
