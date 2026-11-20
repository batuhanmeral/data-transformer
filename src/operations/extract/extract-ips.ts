import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { unsupportedChefOption } from "../_chef-args";
import { formatMatches, mapChefListArgs, uniqueArg } from "./_matches";

// Match IPv6 first so an embedded IPv4 tail cannot be returned as a separate address.
const ipCandidate = /(?<![\w.:])(?:[a-f\d]*:[a-f\d:]*(?:\.\d+){0,3}(?!:)|\d+(?:\.\d+){3})(?!\w|\.[\w.])/gi;
const decimalOctet = /^(?:0|[1-9]\d{0,2})$/;

export default defineOperation({
  id: "extract-ips",
  name: "Extract IPs",
  category: "extract",
  description: "Find IPv4 and IPv6 addresses in text.",
  input: "string",
  output: "string",
  args: z.object({
    v4: z.boolean().default(true).meta({ label: "IPv4" }),
    v6: z.boolean().default(false).meta({ label: "IPv6" }),
    unique: uniqueArg,
  }),
  run(input, { v4, v6, unique }) {
    if (!v4 && !v6) return "";
    const matches: string[] = [];
    for (const [address] of input.matchAll(ipCandidate)) {
      const valid = address.includes(":")
        ? v6 && URL.canParse("http://[" + address + "]/")
        : v4 && address.split(".").every((octet) => decimalOctet.test(octet) && Number(octet) <= 255);
      if (valid) matches.push(address);
    }
    return formatMatches(matches, unique);
  },
  cyberchef: {
    name: "Extract IP addresses",
    mapArgs([v4, v6, removeLocal, ...listArgs]) {
      if (removeLocal === true) unsupportedChefOption("filtering of local IPv4 addresses");
      return { v4: v4 !== false, v6: v6 === true, ...mapChefListArgs(listArgs) };
    },
  },
});
