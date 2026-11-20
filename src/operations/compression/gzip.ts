import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { chefCompressionLevel } from "./_chef-compression";
import type { DeflateOptions } from "fflate";
import { unsupportedChefOption } from "../_chef-args";

export default defineOperation({
  id: "gzip",
  name: "Gzip",
  category: "compression",
  description: "Compress bytes as a Gzip stream.",
  input: "bytes",
  output: "bytes",
  args: z.object({
    level: z.number().int().min(0).max(9).default(6).meta({ label: "Compression level" }),
    filename: z.string().default("").meta({ label: "Filename (optional)" }),
  }),
  async run(input, { level, filename }) {
    const { gzipSync } = await import("fflate");
    return gzipSync(input, { level: level as DeflateOptions["level"], mtime: 0, filename });
  },
  cyberchef: {
    name: "Gzip",
    mapArgs([type, filename, comment, headerChecksum]) {
      if (comment || headerChecksum === true) unsupportedChefOption("Gzip headers");
      return { level: chefCompressionLevel(type), filename: typeof filename === "string" ? filename : undefined };
    },
  },
});
