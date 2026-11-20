import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { bytesToHex } from "../_bytes";

export default defineOperation({
  id: "blake3",
  name: "BLAKE3",
  category: "hash",
  description: "Compute an optionally keyed BLAKE3 digest as hexadecimal.",
  input: "bytes",
  output: "string",
  args: z.object({
    size: z.number().int().min(1).max(65535).default(32).meta({ label: "Size (bytes)" }),
    key: z.string().default("").meta({ label: "Key (UTF-8)" }),
  }),
  async run(input, { size, key }) {
    const { blake3 } = await import("@noble/hashes/blake3.js");
    const keyBytes = key ? new TextEncoder().encode(key) : undefined;
    return bytesToHex(blake3(input, { dkLen: size, key: keyBytes }));
  },
  cyberchef: {
    name: "BLAKE3",
    mapArgs: ([size, key]) => ({ size: size === undefined ? 16 : Number(size), key: typeof key === "string" ? key : undefined }),
  },
});
