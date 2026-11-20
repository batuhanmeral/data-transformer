import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { byteEncodings, bytesToHex, chefByteArg, decodeBytes } from "../_bytes";
import { unsupportedChefOption } from "../_chef-args";

const hashOptions = ["sha1", "sha256", "sha384", "sha512", "md5"] as const;

export default defineOperation({
  id: "hmac",
  name: "HMAC",
  category: "hash",
  description: "Compute a keyed message authentication code as hexadecimal.",
  input: "bytes",
  output: "string",
  args: z.object({
    key: z.string().default("").meta({ label: "Key" }),
    keyEncoding: z.enum(byteEncodings).default("utf8").meta({ label: "Key encoding" }),
    hash: z.enum(hashOptions).default("sha256").meta({ label: "Hash function" }),
  }),
  async run(input, { key, keyEncoding, hash }) {
    const keyBytes = decodeBytes(key, keyEncoding);
    const { hmac } = await import("@noble/hashes/hmac.js");
    if (hash === "sha1" || hash === "md5") {
      const legacy = await import("@noble/hashes/legacy.js");
      return bytesToHex(hmac(legacy[hash], keyBytes, input));
    }
    const sha2 = await import("@noble/hashes/sha2.js");
    return bytesToHex(hmac(sha2[hash], keyBytes, input));
  },
  cyberchef: {
    name: "HMAC",
    mapArgs([key, hash]) {
      const decoded = chefByteArg(key, "Hex");
      const selected = typeof hash === "string" ? hash.toLowerCase() : undefined;
      const algorithm = hashOptions.find((option) => option === selected);
      if (!algorithm) unsupportedChefOption("HMAC hash");
      return { key: decoded.value, keyEncoding: decoded.encoding, hash: algorithm };
    },
  },
});
