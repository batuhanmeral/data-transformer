import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { bytesToHex } from "../_bytes";
import { unsupportedChefOption } from "../_chef-args";

export default defineOperation({
  id: "sha3",
  name: "SHA3",
  category: "hash",
  description: "Compute a SHA3 family digest as hexadecimal.",
  input: "bytes",
  output: "string",
  args: z.object({
    variant: z.number().refine((value) => [224, 256, 384, 512].includes(value), "Unsupported digest size.")
      .default(256).meta({ label: "Size (bits)" }),
  }),
  async run(input, { variant }) {
    const { sha3_224, sha3_256, sha3_384, sha3_512 } = await import("@noble/hashes/sha3.js");
    const hashes: Record<number, typeof sha3_224> = { 224: sha3_224, 256: sha3_256, 384: sha3_384, 512: sha3_512 };
    return bytesToHex(hashes[variant]!(input));
  },
  cyberchef: {
    name: "SHA3",
    mapArgs([variant]) {
      const size = variant === undefined ? 512 : Number(variant);
      if (![224, 256, 384, 512].includes(size)) unsupportedChefOption("SHA3 size");
      return { variant: size };
    },
  },
});
