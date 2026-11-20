import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { detectRawDeflate } from "../../core/magic/detectors";

export default defineOperation({
  id: "raw-inflate",
  name: "Raw Inflate",
  category: "compression",
  description: "Decompress a raw DEFLATE stream.",
  input: "bytes",
  output: "bytes",
  args: z.object({
    start: z.number().int().nonnegative().default(0).meta({ label: "Start offset (bytes)" }),
  }),
  async run(input, { start }) {
    input = input.subarray(start);
    if (input.length === 0) throw new Error("Invalid raw DEFLATE stream.");
    const { inflateSync } = await import("fflate");
    let output: Uint8Array;
    try {
      output = inflateSync(input);
    } catch (cause) {
      throw new Error("Invalid raw DEFLATE stream.", { cause });
    }
    return output;
  },
  magic: { detect: detectRawDeflate },
  cyberchef: {
    name: "Raw Inflate",
    mapArgs: ([start]) => ({ start: typeof start === "number" ? start : undefined }),
  },
});
