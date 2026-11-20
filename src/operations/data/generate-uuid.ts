import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { bytesToHex } from "../_bytes";
import { unsupportedChefOption } from "../_chef-args";

export default defineOperation({
  id: "generate-uuid",
  name: "Generate UUID",
  category: "data",
  description: "Generate a fresh UUID v4 or a time-ordered UUID v7.",
  input: "bytes",
  output: "string",
  args: z.object({
    version: z.enum(["v4", "v7"]).default("v4").meta({ label: "Version" }),
  }),
  cacheable: false,
  run(_input, { version }) {
    if (version === "v4") return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const timestamp = Date.now();
    const view = new DataView(bytes.buffer);
    view.setUint16(0, Math.floor(timestamp / 2 ** 32));
    view.setUint32(2, timestamp);
    bytes[6] = (bytes[6]! & 0x0f) | 0x70;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    const hex = bytesToHex(bytes);
    return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join("-");
  },
  cyberchef: {
    name: "Generate UUID",
    mapArgs([version]): { version?: "v4" | "v7" } {
      if (version === undefined || version === "v4" || version === "v7") return { version };
      return unsupportedChefOption("UUID version");
    },
  },
});
