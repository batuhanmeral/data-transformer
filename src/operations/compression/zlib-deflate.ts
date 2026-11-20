import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { chefCompressionLevel } from "./_chef-compression";
import type { DeflateOptions } from "fflate";

export default defineOperation({
  id: "zlib-deflate",
  name: "Zlib Deflate",
  category: "compression",
  description: "Compress bytes as a Zlib Deflate stream.",
  input: "bytes",
  output: "bytes",
  args: z.object({
    level: z.number().int().min(0).max(9).default(6).meta({ label: "Compression level" }),
  }),
  async run(input, { level }) {
    const { zlibSync } = await import("fflate");
    return zlibSync(input, { level: level as DeflateOptions["level"] });
  },
  cyberchef: {
    name: "Zlib Deflate",
    mapArgs: ([type]) => ({ level: chefCompressionLevel(type) }),
  },
});
