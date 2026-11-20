import { unsupportedChefOption } from "../_chef-args";

export function chefCompressionLevel(value: unknown): number {
  if (value === "None (Store)") return 0;
  if (value === undefined || value === "Dynamic Huffman Coding") return 6;
  return unsupportedChefOption("compression type");
}
