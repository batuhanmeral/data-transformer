import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { bytesToHex } from "../_bytes";
import { unsupportedChefOption } from "../_chef-args";

export default defineOperation({
  id: "sha1",
  name: "SHA1",
  category: "hash",
  description: "Compute the SHA1 digest as hexadecimal.",
  input: "bytes",
  output: "string",
  args: z.object({}),
  async run(input) {
    const { sha1 } = await import("@noble/hashes/legacy.js");
    return bytesToHex(sha1(input));
  },
  cyberchef: {
    name: "SHA1",
    mapArgs([rounds]) {
      if (rounds !== undefined && rounds !== 80) unsupportedChefOption("SHA1 rounds");
      return {};
    },
  },
});
