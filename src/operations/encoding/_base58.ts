export const bitcoinAlphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function base58Symbols(alphabet: string): string[] {
  const symbols = Array.from(alphabet);
  if (symbols.length !== 58 || new Set(symbols).size !== 58 || /\s/u.test(alphabet)) {
    throw new Error("Invalid Base58 alphabet. Use 58 distinct non-whitespace characters.");
  }
  return symbols;
}
