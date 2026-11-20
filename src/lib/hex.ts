export function formatHexRow(bytes: Uint8Array, offset: number): { offset: string; hex: string; ascii: string } {
  const row = bytes.subarray(0, 16);
  const hex: string[] = [];
  let ascii = "";
  for (const byte of row) {
    hex.push(byte.toString(16).padStart(2, "0"));
    ascii += byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : ".";
  }
  return { offset: offset.toString(16).padStart(8, "0"), hex: hex.join(" ").padEnd(47), ascii };
}
