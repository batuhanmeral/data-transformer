import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { byteEncodings, bytesToHex, chefByteArg, decodeBytes } from "../_bytes";
import { unsupportedChefOption } from "../_chef-args";

export default defineOperation({
  id: "blake2b",
  name: "BLAKE2b",
  category: "hash",
  description: "Compute an optionally keyed BLAKE2b digest as hexadecimal.",
  input: "bytes",
  output: "string",
  args: z.object({
    size: z.number().refine((value) => [512, 384, 256, 160, 128].includes(value), "Unsupported digest size.")
      .default(512).meta({ label: "Size (bits)" }),
    key: z.string().default("").meta({ label: "Key" }),
    keyEncoding: z.enum(byteEncodings).default("utf8").meta({ label: "Key encoding" }),
  }),
  async run(input, { size, key, keyEncoding }) {
    const { blake2b } = await import("@noble/hashes/blake2.js");
    const keyBytes = decodeBytes(key, keyEncoding);
    return bytesToHex(blake2b(input, { dkLen: size / 8, key: keyBytes.length > 0 ? keyBytes : undefined }));
  },
  cyberchef: {
    name: "BLAKE2b",
    mapArgs([size, output, key]) {
      if (output !== undefined && output !== "Hex") unsupportedChefOption("BLAKE2b output format");
      const decoded = chefByteArg(key, "UTF8");
      return { size: size === undefined ? undefined : Number(size), key: decoded.value, keyEncoding: decoded.encoding };
    },
  },
});
