import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { decodeUtf8Lossy } from "../../core/convert";

export default defineOperation({
  id: "reverse",
  name: "Reverse",
  category: "text",
  description: "Reverse raw bytes, Unicode characters, or lines.",
  input: "bytes",
  output: "bytes",
  args: z.object({
    mode: z.enum(["byte", "character", "line"]).default("character").meta({ label: "Reverse by" }),
  }),
  run(input, { mode }, ctx) {
    if (mode === "byte") {
      const output = new Uint8Array(input.length);
      for (let index = 0; index < input.length; index++) {
        if (index % 65536 === 0) ctx.progress(index / input.length);
        output[index] = input[input.length - 1 - index]!;
      }
      return output;
    }
    const text = decodeUtf8Lossy(input);
    if (mode === "line") {
      const separator = text.match(/\r\n|\n|\r/)?.[0] ?? "\n";
      return new TextEncoder().encode(text.split(/\r\n|\n|\r/).reverse().join(separator));
    }
    return new TextEncoder().encode(Array.from(text).reverse().join(""));
  },
  cyberchef: {
    name: "Reverse",
    mapArgs: ([mode]) => ({
      mode: mode === "Byte" ? "byte" as const : mode === "Line" ? "line" as const : "character" as const,
    }),
  },
});
