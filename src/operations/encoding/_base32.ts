import { unsupportedChefOption } from "../_chef-args";

export const base32Alphabets = {
  standard: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
  hex: "0123456789ABCDEFGHIJKLMNOPQRSTUV",
};

export function chefBase32Alphabet(value: unknown): keyof typeof base32Alphabets | undefined {
  if (value === undefined) return undefined;
  if (value === "A-Z2-7=") return "standard";
  if (value === "0-9A-V=") return "hex";
  return unsupportedChefOption("Base32 alphabet");
}
