import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { detectBase64 } from "../../core/magic/detectors";

const args = z.object({
  alphabet: z.enum(["standard", "urlsafe"]).default("standard").meta({ label: "Alphabet" }),
  strict: z.boolean().default(false).meta({ label: "Strict mode" }),
});

export default defineOperation({
  id: "from-base64",
  name: "From Base64",
  category: "encoding",
  description: "Decode standard or URL-safe Base64 to bytes.",
  input: "string",
  output: "bytes",
  args,
  run(input, { alphabet, strict }) {
    const invalidChars = alphabet === "urlsafe" ? /[^A-Za-z0-9_=\-]/g : /[^A-Za-z0-9+/=]/g;
    if (strict && invalidChars.test(input)) throw new Error("Invalid Base64 character.");
    const clean = strict ? input : input.replace(invalidChars, "").replaceAll("=", "");
    const encoded = alphabet === "urlsafe" ? clean.replaceAll("-", "+").replaceAll("_", "/") : clean;

    try {
      return Uint8Array.from(atob(encoded), (byte) => byte.charCodeAt(0));
    } catch (cause) {
      throw new Error("Invalid Base64 length or padding.", { cause });
    }
  },
  magic: { detect: detectBase64 },
  cyberchef: {
    name: "From Base64",
    mapArgs([alphabet, removeInvalid, strict]): z.input<typeof args> {
      const options = { strict: strict === true || removeInvalid === false };
      switch (alphabet) {
        case undefined:
        case "A-Za-z0-9+/=":
          return { alphabet: "standard", ...options };
        case "A-Za-z0-9-_":
        case "A-Za-z0-9-_=":
          return { alphabet: "urlsafe", ...options };
        default:
          throw new Error("Unsupported CyberChef Base64 alphabet.");
      }
    },
  },
});
