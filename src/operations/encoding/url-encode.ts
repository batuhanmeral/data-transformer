import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";

export default defineOperation({
  id: "url-encode",
  name: "URL Encode",
  category: "encoding",
  description: "Percent-encode a URL component.",
  input: "string",
  output: "string",
  args: z.object({
    allSpecial: z.boolean().default(false).meta({ label: "Encode all special characters" }),
  }),
  run(input, { allSpecial }) {
    const encoded = encodeURIComponent(input);
    return allSpecial ? encoded.replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`) : encoded;
  },
  cyberchef: {
    name: "URL Encode",
    mapArgs: ([allSpecial]) => ({ allSpecial: allSpecial === true }),
  },
});
