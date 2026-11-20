import { z } from "@/lib/zod";
import { decodeUtf8Lossy } from "../../core/convert";
import { byteEncodings, bytesToHex, chefByteArg, decodeBytes } from "../_bytes";
import { unsupportedChefOption } from "../_chef-args";

const modes = ["CBC", "GCM", "CTR"] as const;
const formats = ["raw", "hex"] as const;
type AesFormat = typeof formats[number];

export const aesArgs = z.object({
  mode: z.enum(modes).default("CBC").meta({ label: "Mode" }),
  key: z.string().default("").meta({ label: "Key" }),
  keyEncoding: z.enum(byteEncodings).default("hex").meta({ label: "Key encoding" }),
  iv: z.string().default("").meta({ label: "IV or nonce" }),
  ivEncoding: z.enum(byteEncodings).default("hex").meta({ label: "IV encoding" }),
  padding: z.boolean().default(true).meta({ label: "CBC padding (PKCS#7)" }),
  aad: z.string().default("").meta({ label: "GCM additional authenticated data" }),
  aadEncoding: z.enum(byteEncodings).default("utf8").meta({ label: "GCM AAD encoding" }),
  inputFormat: z.enum(formats).default("raw").meta({ label: "Input format" }),
  outputFormat: z.enum(formats).default("raw").meta({ label: "Output format" }),
});

export function aesParameters(args: z.output<typeof aesArgs>) {
  const key = decodeBytes(args.key, args.keyEncoding);
  if (![16, 24, 32].includes(key.length)) throw new Error("AES key must be 16, 24, or 32 bytes.");
  const iv = decodeBytes(args.iv, args.ivEncoding);
  if (args.mode === "GCM" ? iv.length < 8 : iv.length !== 16) {
    throw new Error(args.mode === "GCM" ? "AES-GCM nonce must be at least 8 bytes." : "AES IV must be 16 bytes.");
  }
  const aad = args.mode === "GCM" ? decodeBytes(args.aad, args.aadEncoding) : undefined;
  return { key, iv, aad };
}

export function readAesInput(input: Uint8Array, format: AesFormat): Uint8Array {
  return format === "hex" ? decodeBytes(decodeUtf8Lossy(input), "hex") : input;
}

export function formatAesOutput(output: Uint8Array, format: AesFormat): Uint8Array {
  return format === "hex" ? new TextEncoder().encode(bytesToHex(output)) : output;
}

function chefFormat(value: unknown): AesFormat {
  if (value === "Raw") return "raw";
  if (value === "Hex") return "hex";
  return unsupportedChefOption("AES data format");
}

export function chefAesArgs(
  key: unknown, iv: unknown, mode: unknown, input: unknown, output: unknown, aad: unknown,
): z.input<typeof aesArgs> {
  const mappedKey = chefByteArg(key, "Hex");
  const mappedIv = chefByteArg(iv, "Hex");
  const selection = mode === "CBC/NoPadding" || mode === undefined ? "CBC" : mode;
  const mappedMode = modes.find((candidate) => candidate === selection);
  if (!mappedMode) unsupportedChefOption("AES mode");
  const mappedAad = mappedMode === "GCM" ? chefByteArg(aad, "Hex") : undefined;
  return {
    mode: mappedMode,
    padding: mode !== "CBC/NoPadding",
    key: mappedKey.value,
    keyEncoding: mappedKey.encoding,
    iv: mappedIv.value,
    ivEncoding: mappedIv.encoding,
    aad: mappedAad?.value,
    aadEncoding: mappedAad?.encoding,
    inputFormat: chefFormat(input),
    outputFormat: chefFormat(output),
  };
}
