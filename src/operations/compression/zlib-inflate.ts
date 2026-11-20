import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { detectZlib } from "../../core/magic/detectors";
import { adler32 } from "./_checksums";

export default defineOperation({
  id: "zlib-inflate",
  name: "Zlib Inflate",
  category: "compression",
  description: "Decompress a zlib stream.",
  input: "bytes",
  output: "bytes",
  args: z.object({
    start: z.number().int().nonnegative().default(0).meta({ label: "Start offset (bytes)" }),
  }),
  async run(input, { start }, ctx) {
    input = input.subarray(start);
    if (input.length < 6) throw new Error("Invalid zlib header or stream.");
    const trailer = new DataView(input.buffer, input.byteOffset + input.length - 4, 4);
    const { unzlibSync } = await import("fflate");
    let output: Uint8Array;
    try {
      output = unzlibSync(input);
    } catch (cause) {
      throw new Error("Invalid zlib stream.", { cause });
    }
    if (adler32(output, ctx) !== trailer.getUint32(0)) throw new Error("Invalid zlib checksum.");
    return output;
  },
  magic: { detect: detectZlib },
  cyberchef: {
    name: "Zlib Inflate",
    mapArgs: ([start]) => ({ start: typeof start === "number" ? start : undefined }),
  },
});
