import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";

export default defineOperation({
  id: "entropy",
  name: "Entropy",
  category: "data",
  description: "Measure Shannon entropy in bits per byte.",
  input: "bytes",
  output: "number",
  args: z.object({}),
  run(input, _args, ctx) {
    if (input.length === 0) return 0;
    const counts = new Uint32Array(256);
    for (const [index, byte] of input.entries()) {
      if (index % 65536 === 0) ctx.progress(index / input.length);
      counts[byte] = counts[byte]! + 1;
    }

    let entropy = 0;
    for (const count of counts) {
      if (count === 0) continue;
      const probability = count / input.length;
      entropy -= probability * Math.log2(probability);
    }
    return entropy;
  },
  cyberchef: {
    name: "Entropy",
    mapArgs: () => ({}),
  },
});
