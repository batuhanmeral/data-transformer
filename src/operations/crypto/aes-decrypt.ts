import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { aesArgs, aesParameters, chefAesArgs, formatAesOutput, readAesInput } from "./_aes-args";
import { bytesToHex, chefByteArg, decodeBytes } from "../_bytes";
import { unsupportedChefOption } from "../_chef-args";

export default defineOperation({
  id: "aes-decrypt",
  name: "AES Decrypt",
  category: "crypto",
  description: "Decrypt AES-CBC, AES-GCM, or AES-CTR ciphertext.",
  input: "bytes",
  output: "bytes",
  args: aesArgs.extend({
    gcmTag: z.string().default("").meta({ label: "Separate GCM tag (hex)" }),
  }),
  async run(input, args) {
    const { key, iv, aad } = aesParameters(args);
    let source = readAesInput(input, args.inputFormat);
    if (args.mode === "CBC" && source.length % 16 !== 0) {
      throw new Error("AES-CBC ciphertext must contain whole 16-byte blocks.");
    }
    if (args.mode === "GCM" && args.gcmTag) {
      const tag = decodeBytes(args.gcmTag, "hex");
      if (tag.length !== 16) throw new Error("AES-GCM tag must be 16 bytes.");
      const combined = new Uint8Array(source.length + tag.length);
      combined.set(source);
      combined.set(tag, source.length);
      source = combined;
    }

    const { cbc, ctr, gcm } = await import("@noble/ciphers/aes.js");
    const cipher = args.mode === "CBC" ? cbc(key, iv, { disablePadding: !args.padding })
      : args.mode === "CTR" ? ctr(key, iv) : gcm(key, iv, aad);
    return formatAesOutput(cipher.decrypt(source), args.outputFormat);
  },
  cyberchef: {
    name: "AES Decrypt",
    mapArgs([key, iv, , mode, input = "Hex", output = "Raw", tag, aad, ivFromInput]) {
      if (ivFromInput !== undefined && ivFromInput !== "Off") unsupportedChefOption("AES IV from input");
      const mapped = chefAesArgs(key, iv, mode, input, output, aad);
      if (mapped.mode !== "GCM") return mapped;
      const separateTag = chefByteArg(tag, "Hex");
      return { ...mapped, gcmTag: bytesToHex(decodeBytes(separateTag.value, separateTag.encoding)) };
    },
  },
});
