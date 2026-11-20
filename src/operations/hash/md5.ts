import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { bytesToHex } from "../_bytes";

export default defineOperation({
  id: "md5",
  name: "MD5",
  category: "hash",
  description: "Compute the MD5 digest as hexadecimal.",
  input: "bytes",
  output: "string",
  args: z.object({}),
  async run(input) {
    const { md5 } = await import("@noble/hashes/legacy.js");
    return bytesToHex(md5(input));
  },
  cyberchef: {
    name: "MD5",
    mapArgs: () => ({}),
  },
});
