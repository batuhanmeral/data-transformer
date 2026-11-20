import { decodeUtf8Lossy } from "../convert";
import { detectJwt, hasGzipHeader, hasZlibHeader } from "./detectors";

const scoreSampleLimit = 8 * 1024;
const nonprinting = /[^\P{C}\t\n\r]|\uFFFD/u;

export function readability(bytes: Uint8Array): number {
  if (bytes.length === 0) return 0;
  if (hasGzipHeader(bytes) || hasZlibHeader(bytes)) return 0.84;

  const sample = bytes.subarray(0, scoreSampleLimit);
  const text = decodeUtf8Lossy(sample);
  if (sample.length === bytes.length) {
    if (/^\s*[[{]/.test(text)) {
      try {
        JSON.parse(text);
        return 1;
      } catch {
        // Invalid JSON is scored as ordinary text.
      }
    }
    if (detectJwt(sample) > 0.5) return 0.96;
  }

  const counts = new Map<string, number>();
  let printable = 0;
  let size = 0;
  for (const char of text) {
    if (!nonprinting.test(char)) printable++;
    counts.set(char, (counts.get(char) ?? 0) + 1);
    size++;
  }

  let entropy = 0;
  for (const count of counts.values()) {
    const probability = count / size;
    entropy -= probability * Math.log2(probability);
  }
  return (printable / size) * (0.7 + 0.28 * (1 - Math.min(1, entropy / 8)));
}
