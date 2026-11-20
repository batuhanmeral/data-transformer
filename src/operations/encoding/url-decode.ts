import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { detectUrlEncoding } from "../../core/magic/detectors";

export default defineOperation({
  id: "url-decode",
  name: "URL Decode",
  category: "encoding",
  description: "Decode percent escapes in a URL component.",
  input: "string",
  output: "string",
  args: z.object({
    plusAsSpace: z.boolean().default(false).meta({ label: "Treat plus as space" }),
  }),
  run(input, { plusAsSpace }) {
    try {
      return decodeURIComponent(plusAsSpace ? input.replaceAll("+", " ") : input);
    } catch (cause) {
      throw new Error("Invalid URL escape or UTF-8 sequence.", { cause });
    }
  },
  magic: { detect: detectUrlEncoding },
  cyberchef: {
    name: "URL Decode",
    mapArgs: ([plusAsSpace]) => ({ plusAsSpace: plusAsSpace !== false }),
  },
});
