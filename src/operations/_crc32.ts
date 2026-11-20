import type { OperationContext } from "../core/define-operation";

const table = Uint32Array.from({ length: 256 }, (_, byte) => {
  let value = byte;
  for (let i = 0; i < 8; i++) {
    value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
  }
  return value;
});

export function updateCrc32(checksum: number, input: Uint8Array, ctx?: OperationContext): number {
  for (const [index, byte] of input.entries()) {
    if (ctx && index % 65536 === 0) ctx.progress(index / input.length);
    checksum = (checksum >>> 8) ^ table[(checksum ^ byte) & 255]!;
  }
  return checksum;
}
