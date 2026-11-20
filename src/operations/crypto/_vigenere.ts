import type { OperationContext } from "../../core/define-operation";

export function vigenere(input: string, key: string, direction: 1 | -1, ctx: OperationContext): string {
  if (!input) return "";
  if (!/^[a-z]+$/i.test(key)) throw new Error("Vigenère key must contain only ASCII letters.");
  const shifts = Array.from(key.toUpperCase(), (char) => char.charCodeAt(0) - 65);
  let index = 0;
  return input.replace(/[a-z]/gi, (char, offset: number) => {
    if (index % 65536 === 0) ctx.progress(offset / input.length);
    const code = char.charCodeAt(0);
    const start = code >= 97 ? 97 : 65;
    const shift = shifts[index++ % shifts.length]! * direction;
    return String.fromCharCode(start + ((code - start + shift + 26) % 26));
  });
}
