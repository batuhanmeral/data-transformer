import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { bytesToHex } from "../_bytes";
import { unsupportedChefOption } from "../_chef-args";

export default defineOperation({
  id: "sha2",
  name: "SHA2",
  category: "hash",
  description: "Compute a SHA2 family digest as hexadecimal.",
  input: "bytes",
  output: "string",
  args: z.object({
    variant: z.number().refine((value) => [256, 384, 512].includes(value), "Unsupported digest size.")
      .default(256).meta({ label: "Size (bits)" }),
  }),
  async run(input, { variant }) {
    const { sha256, sha384, sha512 } = await import("@noble/hashes/sha2.js");
    const hashes: Record<number, (source: Uint8Array) => Uint8Array> = { 256: sha256, 384: sha384, 512: sha512 };
    return bytesToHex(hashes[variant]!(input));
  },
  cyberchef: {
    name: "SHA2",
    mapArgs([variant, rounds256, rounds512]) {
      if ((rounds256 !== undefined && rounds256 !== 64) || (rounds512 !== undefined && rounds512 !== 160)) {
        unsupportedChefOption("SHA2 rounds");
      }
      const size = variant === undefined ? 512 : Number(variant);
      if (![256, 384, 512].includes(size)) unsupportedChefOption("SHA2 size");
      return { variant: size };
    },
  },
});
