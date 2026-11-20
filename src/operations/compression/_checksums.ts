import type { OperationContext } from "../../core/define-operation";

export function adler32(input: Uint8Array, ctx: OperationContext): number {
  let a = 1;
  let b = 0;
  const modulus = 65521;
  for (const [index, byte] of input.entries()) {
    if (index % 65536 === 0) ctx.progress(index / input.length);
    a = (a + byte) % modulus;
    b = (b + a) % modulus;
  }
  return ((b << 16) | a) >>> 0;
}
