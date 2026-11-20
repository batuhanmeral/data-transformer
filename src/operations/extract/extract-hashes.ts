import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { unsupportedChefOption } from "../_chef-args";
import { formatMatches, uniqueArg } from "./_matches";

const algorithms = ["md5", "sha1", "sha256"] as const;
const hashLengths = { md5: 32, sha1: 40, sha256: 64 };

export default defineOperation({
  id: "extract-hashes",
  name: "Extract Hashes",
  category: "extract",
  description: "Find hexadecimal strings of the selected hash length.",
  input: "string",
  output: "string",
  args: z.object({
    algorithm: z.enum(algorithms).default("md5").meta({ label: "Algorithm" }),
    unique: uniqueArg,
  }),
  run(input, { algorithm, unique }) {
    const pattern = new RegExp("\\b[a-f\\d]{" + hashLengths[algorithm] + "}\\b", "gi");
    return formatMatches(input.match(pattern) ?? [], unique);
  },
  cyberchef: {
    name: "Extract hashes",
    mapArgs([length = 40, allHashes, displayTotal]) {
      if (allHashes === true) unsupportedChefOption("matching of all hash lengths");
      if (displayTotal === true) unsupportedChefOption("display of the match total");
      const algorithm = algorithms.find((key) => length === hashLengths[key] || length === String(hashLengths[key]));
      if (!algorithm) unsupportedChefOption("hash length");
      return { algorithm };
    },
  },
});
