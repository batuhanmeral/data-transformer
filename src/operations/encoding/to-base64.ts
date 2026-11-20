import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { unsupportedChefOption } from "../_chef-args";

export default defineOperation({
  id: "to-base64",
  name: "To Base64",
  category: "encoding",
  description: "Encode bytes as standard Base64.",
  input: "bytes",
  output: "string",
  args: z.object({
    alphabet: z.enum(["standard", "urlsafe"]).default("standard").meta({ label: "Alphabet" }),
  }),
  run(input, { alphabet }) {
    const chunks: string[] = [];
    // Keep each call under the argument limit and align chunks to Base64 triplets.
    const chunkSize = 12_288;
    for (let offset = 0; offset < input.length; offset += chunkSize) {
      chunks.push(btoa(String.fromCharCode(...input.subarray(offset, offset + chunkSize))));
    }
    const encoded = chunks.join("");
    return alphabet === "urlsafe" ? encoded.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "") : encoded;
  },
  cyberchef: {
    name: "To Base64",
    mapArgs([alphabet]) {
      if (alphabet === undefined || alphabet === "A-Za-z0-9+/=") return {};
      if (alphabet === "A-Za-z0-9-_") return { alphabet: "urlsafe" as const };
      return unsupportedChefOption("Base64 alphabet");
    },
  },
});
