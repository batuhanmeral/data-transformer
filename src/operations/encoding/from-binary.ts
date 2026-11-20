import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { detectBinary } from "../../core/magic/detectors";
import { chefDelimiter } from "../_chef-args";

export default defineOperation({
  id: "from-binary",
  name: "From Binary",
  category: "encoding",
  description: "Read binary bytes, separated or packed.",
  input: "string",
  output: "bytes",
  args: z.object({
    delimiter: z.string().default(" ").meta({ label: "Delimiter" }),
    byteLength: z.number().int().min(8).max(256).default(8).meta({ label: "Bit width" }),
  }),
  run(input, { delimiter, byteLength }, ctx) {
    const source = delimiter ? input.replaceAll(delimiter, "") : input;
    const clean = source.replace(/\s/g, "");
    if (!/^[01]*$/.test(clean) || clean.length % byteLength !== 0) throw new Error("Invalid binary input.");
    const output = new Uint8Array(clean.length / byteLength);
    for (let i = 0; i < output.length; i++) {
      if (i % 65536 === 0) ctx.progress(i / output.length);
      const byte = Number.parseInt(clean.slice(i * byteLength, (i + 1) * byteLength), 2);
      if (byte > 255) throw new Error("Invalid binary byte.");
      output[i] = byte;
    }
    return output;
  },
  magic: { detect: detectBinary },
  cyberchef: {
    name: "From Binary",
    mapArgs: ([delimiter, byteLength]) => ({
      delimiter: chefDelimiter(delimiter),
      byteLength: typeof byteLength === "number" ? byteLength : undefined,
    }),
  },
});
