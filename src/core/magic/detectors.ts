import { decodeUtf8Lossy } from "../convert";

export function detectBase64(sample: Uint8Array): number {
  const text = decodeUtf8Lossy(sample).trim().replace(/[\r\n]/g, "");
  if (!/^[A-Za-z0-9+/]{2,}={0,2}$/.test(text)) return 0;
  const data = text.replace(/=+$/, "");
  const remainder = data.length % 4;
  if (remainder === 1 || (text.endsWith("=") && (remainder === 0 || text.length % 4 !== 0))) return 0;

  // Padding and alphabet-specific symbols are stronger evidence than case alone.
  if (/[+/=]/.test(text)) return 0.9;
  const mixedCase = /[A-Z]/.test(text) && /[a-z]/.test(text);
  const longUppercase = /^[A-Z\d]{8,}$/.test(text);
  return mixedCase || longUppercase ? 0.65 : 0;
}

export function detectBase32(sample: Uint8Array): number {
  const text = decodeUtf8Lossy(sample).replace(/\s/g, "");
  if (!/^[A-Z2-7]{2,}={0,6}$/.test(text)) return 0;
  const data = text.replace(/=+$/, "");
  const remainder = data.length % 8;
  if (![0, 2, 4, 5, 7].includes(remainder)) return 0;
  if (data.length !== text.length) return remainder !== 0 && text.length % 8 === 0 ? 0.9 : 0;
  return data.length >= 8 || /[2-7]/.test(data) ? 0.65 : 0;
}

export function detectHex(sample: Uint8Array): number {
  const text = decodeUtf8Lossy(sample).trim();
  const groups = text.split(/(?:\s|[,;:-]|0x|\\x|%)+/i).filter(Boolean);
  const digits = groups.join("");
  if (digits.length < 4 || !groups.every((group) => /^(?:[0-9a-f]{2})+$/i.test(group))) return 0;
  return digits.length < text.length ? 0.94 : 0.75;
}

export function detectUrlEncoding(sample: Uint8Array): number {
  return /%[\da-f]{2}/i.test(decodeUtf8Lossy(sample)) ? 0.9 : 0;
}

export function detectHtmlEntities(sample: Uint8Array): number {
  return /&(?:[a-z][a-z\d]*|#\d+|#x[\da-f]+);/i.test(decodeUtf8Lossy(sample)) ? 0.9 : 0;
}

export function hasGzipHeader([first, second, method, flags]: Uint8Array): boolean {
  return first === 0x1f && second === 0x8b && method === 8 && flags !== undefined && (flags & 0xe0) === 0;
}

export function hasZlibHeader([method, flags]: Uint8Array): boolean {
  return method !== undefined && flags !== undefined
    && (method & 0x0f) === 8 && (method >>> 4) <= 7
    && (flags & 0x20) === 0 && ((method << 8) + flags) % 31 === 0;
}

export function detectGzip(sample: Uint8Array): number {
  return sample.length >= 20 && hasGzipHeader(sample) ? 1 : 0;
}

export function detectZlib(sample: Uint8Array): number {
  return sample.length >= 6 && hasZlibHeader(sample) ? 0.99 : 0;
}

export function detectRawDeflate(sample: Uint8Array): number {
  if (sample.length < 3 || hasGzipHeader(sample) || hasZlibHeader(sample)) return 0;
  const [header = 0, lenLo = 0, lenHi = 0, complementLo = 0, complementHi = 0] = sample;
  const blockType = (header >>> 1) & 3;
  if (blockType === 0) {
    const length = lenLo | (lenHi << 8);
    return length + 5 <= sample.length
      && (lenLo ^ complementLo) === 255 && (lenHi ^ complementHi) === 255 ? 0.9 : 0;
  }
  // Fixed and dynamic blocks have no signature. Only probe plausible binary streams.
  if (blockType === 3 || (blockType === 2 && (header >>> 3) > 29)) return 0;
  return /[^\P{C}\t\n\r]|\uFFFD/u.test(decodeUtf8Lossy(sample)) ? 0.55 : 0;
}

export function detectJwt(sample: Uint8Array): number {
  const text = decodeUtf8Lossy(sample).trim();
  const [header, payload, signature, extra] = text.split(".");
  if (!header || !payload || signature === undefined || extra !== undefined) return 0;
  if (![header, payload, signature].every((part) => /^[A-Za-z0-9_-]*$/.test(part) && part.length % 4 !== 1)) return 0;
  try {
    const jsonObject = (part: string) => {
      const bytes = Uint8Array.from(atob(part.replaceAll("-", "+").replaceAll("_", "/")), (char) => char.charCodeAt(0));
      const parsed: unknown = JSON.parse(decodeUtf8Lossy(bytes));
      return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
    };
    return jsonObject(header) && jsonObject(payload) ? 0.99 : 0;
  } catch {
    return 0;
  }
}

export function detectBinary(sample: Uint8Array): number {
  const bits = decodeUtf8Lossy(sample).replace(/\s/g, "");
  return bits.length >= 8 && bits.length % 8 === 0 && /^[01]+$/.test(bits) ? 0.94 : 0;
}

export function detectDecimal(sample: Uint8Array): number {
  const groups = decodeUtf8Lossy(sample).trim().split(/[\s,;:]+/);
  return groups.length >= 3 && groups.every((group) => /^\d{1,3}$/.test(group) && Number(group) <= 255) ? 0.85 : 0;
}
