import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { byteEncodings, chefByteArg, decodeBytes } from "../_bytes";
import { unsupportedChefOption } from "../_chef-args";

export default defineOperation({
  id: "xor",
  name: "XOR",
  category: "crypto",
  description: "Apply a repeating XOR key to bytes.",
  input: "bytes",
  output: "bytes",
  args: z.object({
    key: z.string().default("").meta({ label: "Key" }),
    keyEncoding: z.enum(byteEncodings).default("hex").meta({ label: "Key encoding" }),
    scheme: z.enum(["standard"]).default("standard").meta({ label: "Scheme" }),
  }),
  run(input, { key, keyEncoding }, ctx) {
    const keyBytes = decodeBytes(key, keyEncoding);
    if (keyBytes.length === 0) return input.slice();
    const output = new Uint8Array(input.length);
    for (const [index, byte] of input.entries()) {
      if (index % 65536 === 0) ctx.progress(index / input.length);
      output[index] = byte ^ keyBytes[index % keyBytes.length]!;
    }
    return output;
  },
  cyberchef: {
    name: "XOR",
    mapArgs([key, scheme, preserveNull]) {
      if (scheme !== undefined && scheme !== "Standard") unsupportedChefOption("XOR scheme");
      if (preserveNull === true) unsupportedChefOption("null-preserving XOR");
      const decoded = chefByteArg(key, "Hex");
      return { key: decoded.value, keyEncoding: decoded.encoding, scheme: "standard" as const };
    },
  },
});
