import { chefToggle, unsupportedChefOption } from "./_chef-args";

export const byteEncodings = ["hex", "utf8", "base64"] as const;
export type ByteEncoding = typeof byteEncodings[number];

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function decodeBytes(value: string, encoding: ByteEncoding): Uint8Array {
  if (encoding === "utf8") return new TextEncoder().encode(value);

  if (encoding === "base64") {
    try {
      return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
    } catch (cause) {
      throw new Error("Invalid Base64 value.", { cause });
    }
  }

  const digits = value.replace(/(?:0x|[\s:])/gi, "");
  if (!/^(?:[0-9a-f]{2})*$/i.test(digits)) throw new Error("Invalid hexadecimal value.");
  const bytes = new Uint8Array(digits.length / 2);
  for (let i = 0; i < digits.length; i += 2) {
    bytes[i / 2] = Number.parseInt(digits.slice(i, i + 2), 16);
  }
  return bytes;
}

export function chefByteArg(value: unknown, defaultOption: string): { value: string; encoding: ByteEncoding } {
  const toggle = chefToggle(value, defaultOption);
  if (toggle.string === "") return { value: "", encoding: "hex" };
  const option = toggle.option.toLowerCase();
  const encoding = byteEncodings.find((item) => item === option);
  if (!encoding) unsupportedChefOption("byte encoding");
  return { value: toggle.string, encoding };
}
