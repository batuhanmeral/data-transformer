import { defineOperation } from "../../core/define-operation";
import { aesArgs, aesParameters, chefAesArgs, formatAesOutput, readAesInput } from "./_aes-args";
import { unsupportedChefOption } from "../_chef-args";

export default defineOperation({
  id: "aes-encrypt",
  name: "AES Encrypt",
  category: "crypto",
  description: "Encrypt bytes using AES-CBC, AES-GCM, or AES-CTR.",
  input: "bytes",
  output: "bytes",
  args: aesArgs,
  async run(input, args) {
    const { key, iv, aad } = aesParameters(args);
    const source = readAesInput(input, args.inputFormat);
    if (args.mode === "CBC" && !args.padding && source.length % 16 !== 0) {
      throw new Error("AES-CBC without padding requires whole 16-byte blocks.");
    }
    const { cbc, ctr, gcm } = await import("@noble/ciphers/aes.js");
    const cipher = args.mode === "CBC" ? cbc(key, iv, { disablePadding: !args.padding })
      : args.mode === "CTR" ? ctr(key, iv) : gcm(key, iv, aad);
    return formatAesOutput(cipher.encrypt(source), args.outputFormat);
  },
  cyberchef: {
    name: "AES Encrypt",
    mapArgs([key, iv, mode, input = "Raw", output = "Hex", aad, includeIv]) {
      if (includeIv !== undefined && includeIv !== "Off") unsupportedChefOption("AES output IV placement");
      return chefAesArgs(key, iv, mode, input, output, aad);
    },
  },
});
