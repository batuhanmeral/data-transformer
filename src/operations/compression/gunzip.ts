import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { detectGzip } from "../../core/magic/detectors";
import { updateCrc32 } from "../_crc32";

export default defineOperation({
  id: "gunzip",
  name: "Gunzip",
  category: "compression",
  input: "bytes",
  output: "bytes",
  description: "Decompress and check the integrity of a gzip stream.",
  args: z.object({}),
  async run(input, _args, ctx) {
    if (input.length < 20 || input[0] !== 0x1f || input[1] !== 0x8b ||
        input[2] !== 8 || (input[3]! & 0xe0) !== 0) {
      throw new Error("Invalid gzip header or stream.");
    }

    // Grow from bytes actually decompressed, independent of the claimed trailer size.
    const { Gunzip } = await import("fflate");
    const chunks: Uint8Array[] = [];
    let totalSize = 0;
    let memberStart = 0;
    let memberSize = 0;
    let checksum = 0xffffffff;
    const stream = new Gunzip((chunk) => {
      if (chunk.length === 0) return;
      chunks.push(chunk);
      totalSize += chunk.length;
      memberSize += chunk.length;
      checksum = updateCrc32(checksum, chunk);
    });
    const verifyMember = (end: number) => {
      if (end - memberStart < 20) throw new Error("Invalid gzip member length.");
      const footer = new DataView(input.buffer, input.byteOffset + end - 8, 8);
      if ((~checksum >>> 0) !== footer.getUint32(0, true)) throw new Error("Invalid gzip checksum.");
      if ((memberSize >>> 0) !== footer.getUint32(4, true)) throw new Error("Invalid gzip size.");
      memberStart = end;
      memberSize = 0;
      checksum = 0xffffffff;
    };
    stream.onmember = verifyMember;

    const chunkSize = 16 * 1024;
    try {
      for (let offset = 0; offset < input.length; offset += chunkSize) {
        ctx.progress(offset / input.length);
        stream.push(input.subarray(offset, offset + chunkSize), offset + chunkSize >= input.length);
      }
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : String(cause);
      throw new Error(`Invalid gzip stream: ${detail}`, { cause });
    }
    verifyMember(input.length);

    const output = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      output.set(chunk, offset);
      offset += chunk.length;
    }
    return output;
  },
  magic: { detect: detectGzip },
  cyberchef: {
    name: "Gunzip",
    mapArgs: () => ({}),
  },
});
