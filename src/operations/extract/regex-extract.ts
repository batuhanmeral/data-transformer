import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { unsupportedChefOption } from "../_chef-args";
import { makeRegExp } from "../text/_regexp";
import { formatMatches, uniqueArg } from "./_matches";

export default defineOperation({
  id: "regex-extract",
  name: "Regex Extract",
  category: "extract",
  description: "Extract full matches or a capture group using a regular expression.",
  input: "string",
  output: "string",
  args: z.object({
    pattern: z.string().default("").meta({ label: "Pattern" }),
    flags: z.string().default("g").meta({ label: "Flags", description: "Use g to extract all matches." }),
    group: z.number().int().nonnegative().default(0).meta({ label: "Capture group", description: "0 returns the full match." }),
    outputFormat: z.enum(["list", "json"]).default("list").meta({ label: "Output format" }),
    unique: uniqueArg,
  }),
  run(input, { pattern, flags, group, outputFormat, unique }) {
    const regex = makeRegExp(pattern, flags);
    const matches: string[] = [];
    if (pattern && input) {
      const results = regex.global ? input.matchAll(regex) : [regex.exec(input)];
      for (const result of results) {
        const match = result?.[group];
        if (match !== undefined) matches.push(match);
      }
    }
    return formatMatches(matches, unique, outputFormat);
  },
  cyberchef: {
    name: "Regular expression",
    mapArgs([, pattern, caseInsensitive, multiline, dotAll, unicode, astral, displayTotal, format]) {
      if (astral === true) unsupportedChefOption("astral regex mode");
      if (displayTotal === true) unsupportedChefOption("display of the match total");
      if (format !== "List matches") unsupportedChefOption("regular expression output format");
      const flags = "g"
        + (caseInsensitive !== false ? "i" : "")
        + (multiline !== false ? "m" : "")
        + (dotAll === true ? "s" : "")
        + (unicode === true ? "u" : "");
      return { pattern: typeof pattern === "string" ? pattern : "", flags };
    },
  },
});
