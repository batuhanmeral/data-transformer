import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { unsupportedChefOption } from "../_chef-args";
import { updateCrc32 } from "../_crc32";


export default defineOperation({
  id: "crc32",
  name: "CRC32",
  category: "hash",
  description: "Compute the CRC-32/ISO-HDLC checksum as hexadecimal.",
  input: "bytes",
  output: "string",
  args: z.object({}),
  run(input, _args, ctx) {
    const checksum = updateCrc32(0xffffffff, input, ctx);
    return (~checksum >>> 0).toString(16).padStart(8, "0");
  },
  cyberchef: {
    name: "CRC Checksum",
    mapArgs([algorithm]) {
      if (algorithm !== "CRC-32" && algorithm !== "CRC-32/ISO-HDLC" && algorithm !== "CRC-32/ADCCP" &&
          algorithm !== "CRC-32/V-42" && algorithm !== "CRC-32/PKZIP") unsupportedChefOption("CRC variant");
      return {};
    },
  },
});
