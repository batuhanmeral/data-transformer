import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { chefToggle, unsupportedChefOption } from "../_chef-args";
import { escapeRegExp, makeRegExp } from "./_regexp";

export default defineOperation({
  id: "count-occurrences",
  name: "Count Occurrences",
  category: "text",
  description: "Count nonoverlapping matches of a literal string or regular expression.",
  input: "string",
  output: "number",
  args: z.object({
    find: z.string().default("").meta({ label: "Find" }),
    mode: z.enum(["regex", "simple"]).default("simple").meta({ label: "Mode" }),
  }),
  run(input, { find, mode }, ctx) {
    if (!find) return 0;
    const pattern = mode === "regex" ? find : escapeRegExp(find);
    const matches = input.matchAll(makeRegExp(pattern, "g"));
    let count = 0;
    for (const match of matches) {
      if (count++ % 65536 === 0) ctx.progress(input.length ? match.index / input.length : 0);
    }
    return count;
  },
  cyberchef: {
    name: "Count occurrences",
    mapArgs([find]) {
      const toggle = chefToggle(find, "Simple string");
      if (toggle.option !== "Regex" && toggle.option !== "Simple string") unsupportedChefOption("search mode");
      return { find: toggle.string, mode: toggle.option === "Regex" ? "regex" as const : "simple" as const };
    },
  },
});
